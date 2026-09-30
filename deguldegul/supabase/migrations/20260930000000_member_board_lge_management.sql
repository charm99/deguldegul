-- Member administration, average reset, free-board categories, and league meetings.

alter table public.degul_users
  add column if not exists average_start_date date not null default date '2026-07-01';

comment on column public.degul_users.average_start_date
  is 'Only meetings on or after this date participate in average/score aggregates.';

alter table public.degul_board
  add column if not exists category text;

update public.degul_board set category = 'GEN'
where board_tp = 'FRI' and category is null;

alter table public.degul_board drop constraint if exists degul_board_category_check;
alter table public.degul_board add constraint degul_board_category_check
  check (category is null or category in ('GEN', 'SLP', 'USED'));

comment on column public.degul_board.category is 'GEN: 일반, SLP: 휴면신청, USED: 중고거래';

insert into public.degul_comm_cd (grp_cd, com_cd, com_nm, sort_no, use_yn)
values ('0006', 'LGE', '리그전', 4, 'Y')
on conflict (grp_cd, com_cd) do update
set com_nm = excluded.com_nm, sort_no = excluded.sort_no, use_yn = 'Y';

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_status text default null,
  p_role text default null,
  p_average_start_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.degul_users
    where id = auth.uid() and role = 'ADM' and status = 'ACT'
  ) then
    raise exception 'ADM 권한자만 회원 설정을 변경할 수 있습니다.';
  end if;

  if p_status is not null and p_status not in ('ACT', 'SLP', 'PND', 'REJ') then
    raise exception '올바르지 않은 회원 상태입니다.';
  end if;
  if p_role is not null and p_role not in ('ADM', 'MGR', 'STF', 'MBR') then
    raise exception '올바르지 않은 역할입니다.';
  end if;

  update public.degul_users
     set status = coalesce(p_status, status),
         role = coalesce(p_role, role),
         average_start_date = coalesce(p_average_start_date, average_start_date)
   where id = p_user_id;

  if not found then raise exception '회원을 찾을 수 없습니다.'; end if;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, date) from public;
grant execute on function public.admin_update_user(uuid, text, text, date) to authenticated;

-- Enforce the LGE restriction in the database as well as in the UI.
create or replace function public.enforce_lge_attendance_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_meeting_type text; v_role text;
begin
  select meeting_tp into v_meeting_type from public.degul_meeting where meeting_id = new.meeting_id;
  if v_meeting_type = 'LGE' then
    select role into v_role from public.degul_users where id = new.user_id and status = 'ACT';
    if v_role is null or v_role not in ('ADM', 'MGR', 'STF') then
      raise exception '리그전은 관리자, 매니저, 스태프만 참여할 수 있습니다.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_lge_attendance_role on public.degul_attendance;
create trigger trg_enforce_lge_attendance_role
before insert or update on public.degul_attendance
for each row execute function public.enforce_lge_attendance_role();

-- Score-only aggregates are recreated so every average uses the member's reset date.
drop function if exists public.get_my_stats();
create function public.get_my_stats()
returns table(avg_score numeric, high_score integer, game_cnt bigint, total_score bigint,
  attendance_count bigint, attendance_rate numeric)
language sql stable security definer set search_path = public as $$
  with me as (select coalesce(average_start_date, date '2026-07-01') start_date from degul_users where id = auth.uid()),
  score_stats as (
    select round(avg(s.score)::numeric, 2) avg_score, max(s.score)::integer high_score,
      count(*) game_cnt, coalesce(sum(s.score), 0)::bigint total_score
    from degul_score s join degul_meeting m on m.meeting_id = s.meeting_id cross join me
    where s.user_id = auth.uid() and m.meeting_dt::date >= me.start_date and m.status = 'CLS'
  ), attendance_stats as (
    select count(*) filter (where a.attendance_tp in ('ATD','LAT')) attendance_count,
      round(100.0 * count(*) filter (where a.attendance_tp in ('ATD','LAT')) / nullif(count(*), 0), 2) attendance_rate
    from degul_attendance a join degul_meeting m on m.meeting_id = a.meeting_id
    where a.user_id = auth.uid() and m.status = 'CLS'
  )
  select coalesce(s.avg_score,0), coalesce(s.high_score,0), s.game_cnt, s.total_score,
    a.attendance_count, coalesce(a.attendance_rate,0) from score_stats s cross join attendance_stats a;
$$;

drop function if exists public.get_my_monthly_avg(integer);
create function public.get_my_monthly_avg(p_year integer)
returns table(year_no integer, year_label text, avg_score numeric)
language sql stable security definer set search_path = public as $$
  select extract(month from m.meeting_dt)::integer,
    extract(month from m.meeting_dt)::integer || '월', round(avg(s.score)::numeric, 2)
  from degul_score s join degul_meeting m on m.meeting_id=s.meeting_id join degul_users u on u.id=s.user_id
  where s.user_id=auth.uid() and m.status='CLS' and extract(year from m.meeting_dt)=p_year
    and m.meeting_dt::date >= coalesce(u.average_start_date, date '2026-07-01')
  group by extract(month from m.meeting_dt) order by 1;
$$;

drop function if exists public.get_score_ranking(text, integer);
create function public.get_score_ranking(p_range text, p_year integer)
returns table(ranking_tp text, rank_no bigint, user_id uuid, user_nm text, nickname text,
  avg_score numeric, high_score integer, game_count bigint)
language sql stable security definer set search_path = public as $$
  with stats as (
    select u.id user_id, u.name user_nm, u.nickname, round(avg(s.score)::numeric,2) avg_score,
      max(s.score)::integer high_score, count(*) game_count
    from degul_users u join degul_score s on s.user_id=u.id join degul_meeting m on m.meeting_id=s.meeting_id
    where u.status='ACT' and m.status='CLS'
      and m.meeting_dt::date >= coalesce(u.average_start_date, date '2026-07-01')
      and (p_range='TOTAL' or extract(year from m.meeting_dt)=p_year)
    group by u.id, u.name, u.nickname
  ), ranked as (
    select 'AVG'::text ranking_tp, rank() over(order by avg_score desc) rank_no, * from stats
    union all select 'HIGH', rank() over(order by high_score desc), * from stats
  )
  select ranking_tp, rank_no, user_id, user_nm, nickname, avg_score, high_score, game_count
  from ranked where rank_no <= 10 order by ranking_tp, rank_no;
$$;

drop function if exists public.get_my_recent_games(integer);
create function public.get_my_recent_games(p_limit integer default 5)
returns table(meeting_id uuid, meeting_dt timestamptz, center_nm text, game_count bigint,
  avg_score numeric, scores integer[])
language sql stable security definer set search_path = public as $$
  select m.meeting_id, m.meeting_dt, c.center_nm, count(*) game_count,
    round(avg(s.score)::numeric, 2) avg_score, array_agg(s.score::integer order by s.game_no) scores
  from degul_score s join degul_meeting m on m.meeting_id=s.meeting_id
  left join degul_center c on c.center_id=m.center_id join degul_users u on u.id=s.user_id
  where s.user_id=auth.uid() and m.status='CLS'
    and m.meeting_dt::date >= coalesce(u.average_start_date, date '2026-07-01')
  group by m.meeting_id, m.meeting_dt, c.center_nm order by m.meeting_dt desc limit p_limit;
$$;

grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.get_my_monthly_avg(integer) to authenticated;
grant execute on function public.get_score_ranking(text, integer) to authenticated;
grant execute on function public.get_my_recent_games(integer) to authenticated;

create or replace function public.get_admin_average_stats()
returns table(
  id uuid, name text, nickname text, role text, status text, average_start_date date,
  game_count bigint, avg_score numeric, high_score integer, low_score integer, total_score bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (
    select 1 from degul_users where degul_users.id = auth.uid()
      and degul_users.status = 'ACT' and degul_users.role in ('ADM','MGR','STF')
  ) then
    raise exception '관리자 메뉴 접근 권한이 필요합니다.';
  end if;

  return query
  select u.id, u.name::text, u.nickname::text, u.role::text, u.status::text,
    coalesce(u.average_start_date, date '2026-07-01'), stats.game_count,
    stats.avg_score, stats.high_score, stats.low_score, stats.total_score
  from degul_users u
  cross join lateral (
    select count(s.score) game_count, round(avg(s.score)::numeric, 2) avg_score,
      max(s.score)::integer high_score, min(s.score)::integer low_score,
      coalesce(sum(s.score), 0)::bigint total_score
    from degul_score s join degul_meeting m on m.meeting_id = s.meeting_id
    where s.user_id = u.id and m.status = 'CLS'
      and m.meeting_dt::date >= coalesce(u.average_start_date, date '2026-07-01')
  ) stats;
end;
$$;

revoke all on function public.get_admin_average_stats() from public;
grant execute on function public.get_admin_average_stats() to authenticated;
