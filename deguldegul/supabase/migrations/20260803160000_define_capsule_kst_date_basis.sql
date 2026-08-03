-- 날짜/시간 기준(KST 영업일)
-- 1. 실제 시각(meeting_dt 등)은 UTC timestamptz로 저장한다.
-- 2. 캡슐 회차의 start_dt/end_dt는 한국 영업일(date)이다.
-- 3. UTC 시각을 회차 날짜와 비교할 때는 반드시 Asia/Seoul 날짜로 변환한다.
--
-- 이전 버전 함수의 current_date 및 timestamptz::date도 즉시 KST로 동작하게 한다.
-- 함수 본문은 각 원본 마이그레이션에서 AT TIME ZONE으로 명시해 신규 환경에서도
-- 세션 TimeZone에 의존하지 않는다.

alter function public.get_capsule_dashboard(bigint)
  set timezone = 'Asia/Seoul';

alter function public.draw_capsule(bigint)
  set timezone = 'Asia/Seoul';

alter function public.award_capsule_coin_on_battle_attendance()
  set timezone = 'Asia/Seoul';

alter function public.admin_grant_attendance_capsule_coins(bigint, uuid)
  set timezone = 'Asia/Seoul';

alter function public.admin_backfill_battle_capsule_coins(bigint, uuid)
  set timezone = 'Asia/Seoul';

-- 기존 DB에 배포된 함수의 정기전(REG) 제한을 제거한다.
-- 번개(FLS)를 포함해 실제 배틀 참가 조건을 충족한 모든 유효 모임을 허용한다.
create or replace function public.admin_grant_attendance_capsule_coins(
  p_round_id bigint,
  p_meeting_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_count integer;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if not exists (
    select 1
      from public.degul_capsule_round r
     where r.round_id = p_round_id
       and r.use_yn = 'Y'
  ) then
    raise exception '회차가 없습니다.';
  end if;

  if not exists (
    select 1
      from public.degul_meeting m
      join public.degul_capsule_round r
        on r.round_id = p_round_id
     where m.meeting_id = p_meeting_id
       and coalesce(m.use_yn, 'Y') = 'Y'
       and (m.meeting_dt at time zone 'Asia/Seoul')::date
           between r.start_dt and r.end_dt
  ) then
    raise exception '회차 기간에 포함된 유효한 모임이 아닙니다.';
  end if;

  insert into public.degul_capsule_coin_history (
    user_id, round_id, meeting_id, coin_tp, coin_qty, memo, created_by
  )
  select
    a.user_id,
    p_round_id,
    p_meeting_id,
    'ATD',
    1,
    '배틀로얄 참가 코인 지급',
    auth.uid()
  from public.degul_attendance a
  where a.meeting_id = p_meeting_id
    and a.attendance_tp in ('ATD', 'LAT')
    and a.battle_join_yn = 'Y'
  on conflict (user_id, round_id, meeting_id)
    where coin_tp = 'ATD'
    do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

create or replace function public.award_capsule_coin_on_battle_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id bigint;
begin
  if new.point_tp <> 'ATD'
     or new.meeting_id is null
     or new.user_id is null then
    return new;
  end if;

  if not exists (
    select 1
      from public.degul_meeting m
      join public.degul_attendance a
        on a.meeting_id = m.meeting_id
       and a.user_id = new.user_id
     where m.meeting_id = new.meeting_id
       and coalesce(m.use_yn, 'Y') = 'Y'
       and a.attendance_tp in ('ATD', 'LAT')
       and a.battle_join_yn = 'Y'
  ) then
    return new;
  end if;

  select r.round_id
    into v_round_id
    from public.degul_capsule_round r
    join public.degul_meeting m
      on m.meeting_id = new.meeting_id
   where r.use_yn = 'Y'
     and r.status = 'OPN'
     and (m.meeting_dt at time zone 'Asia/Seoul')::date
         between r.start_dt and r.end_dt
   order by r.start_dt desc, r.round_id desc
   limit 1;

  if v_round_id is null then
    return new;
  end if;

  insert into public.degul_capsule_coin_history (
    user_id, round_id, meeting_id, coin_tp, coin_qty, memo, created_by
  )
  values (
    new.user_id,
    v_round_id,
    new.meeting_id,
    'ATD',
    1,
    '배틀로얄 참가 코인 지급',
    auth.uid()
  )
  on conflict (user_id, round_id, meeting_id)
    where coin_tp = 'ATD'
    do nothing;

  return new;
end;
$$;

revoke all on function public.award_capsule_coin_on_battle_attendance()
  from public;

revoke all on function public.admin_grant_attendance_capsule_coins(bigint, uuid)
  from public;
grant execute on function public.admin_grant_attendance_capsule_coins(bigint, uuid)
  to authenticated;

-- 상품 수량은 실제 당첨(PRIZE) 수량만, 배정 수량은 꽝(LOSE)을 포함해 집계한다.
create or replace function public.admin_get_capsule_rounds()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select coalesce(
    jsonb_agg(to_jsonb(x) order by x.round_year desc, x.round_no desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      r.round_id,
      r.round_year,
      r.round_no,
      r.round_nm,
      r.start_dt,
      r.end_dt,
      r.total_capsule_cnt,
      r.status,
      r.use_yn,
      coalesce((
        select sum(p.total_qty)
          from public.degul_capsule_prize p
         where p.round_id = r.round_id
           and p.use_yn = 'Y'
           and p.prize_tp = 'PRIZE'
      ), 0)::integer as prize_total_qty,
      coalesce((
        select sum(p.total_qty)
          from public.degul_capsule_prize p
         where p.round_id = r.round_id
           and p.use_yn = 'Y'
      ), 0)::integer as allocated_total_qty,
      (
        select count(*)
          from public.degul_capsule c
         where c.round_id = r.round_id
      )::integer as generated_capsule_cnt,
      (
        select count(*)
          from public.degul_capsule c
         where c.round_id = r.round_id
           and c.draw_yn = 'Y'
      )::integer as drawn_capsule_cnt
    from public.degul_capsule_round r
  ) x;

  return v_result;
end;
$$;

revoke all on function public.admin_get_capsule_rounds()
  from public;
grant execute on function public.admin_get_capsule_rounds()
  to authenticated;
