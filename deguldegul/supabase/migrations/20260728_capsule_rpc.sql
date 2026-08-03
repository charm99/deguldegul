-- =========================================================
-- Capsule draw RPCs
-- Requires:
--   degul_capsule_round, degul_capsule_prize, degul_capsule
--   degul_capsule_coin_history
--   is_degul_admin()
-- =========================================================

alter table public.degul_capsule_round enable row level security;
alter table public.degul_capsule_prize enable row level security;
alter table public.degul_capsule enable row level security;
alter table public.degul_capsule_coin_history enable row level security;

create or replace function public.get_capsule_dashboard(
  p_round_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_round public.degul_capsule_round%rowtype;
  v_coin_balance integer := 0;
  v_remain_capsule_cnt integer := 0;
  v_remain_prize_cnt integer := 0;
  v_prizes jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_round_id is null then
    select r.*
      into v_round
      from public.degul_capsule_round r
     where r.use_yn = 'Y'
       and r.status = 'OPN'
       and (current_timestamp at time zone 'Asia/Seoul')::date
           between r.start_dt and r.end_dt
     order by r.start_dt desc, r.round_id desc
     limit 1;
  else
    select r.*
      into v_round
      from public.degul_capsule_round r
     where r.round_id = p_round_id
       and r.use_yn = 'Y';
  end if;

  if not found then
    return jsonb_build_object(
      'round', null,
      'coin_balance', 0,
      'remain_capsule_cnt', 0,
      'remain_prize_cnt', 0,
      'prizes', '[]'::jsonb
    );
  end if;

  select coalesce(sum(h.coin_qty), 0)::integer
    into v_coin_balance
    from public.degul_capsule_coin_history h
   where h.user_id = v_user_id
     and h.round_id = v_round.round_id;

  select count(*)::integer
    into v_remain_capsule_cnt
    from public.degul_capsule c
   where c.round_id = v_round.round_id
     and c.draw_yn = 'N';

  select count(*)::integer
    into v_remain_prize_cnt
    from public.degul_capsule c
    join public.degul_capsule_prize p
      on p.prize_id = c.prize_id
     and p.round_id = c.round_id
   where c.round_id = v_round.round_id
     and c.draw_yn = 'N'
     and p.prize_tp = 'PRIZE'
     and p.use_yn = 'Y';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'prize_id', x.prize_id,
        'prize_nm', x.prize_nm,
        'prize_tp', x.prize_tp,
        'total_qty', x.total_qty,
        'remain_qty', x.remain_qty,
        'drawn_qty', x.drawn_qty,
        'image_url', x.image_url,
        'memo', x.memo,
        'sort_no', x.sort_no
      )
      order by x.sort_no, x.prize_id
    ),
    '[]'::jsonb
  )
  into v_prizes
  from (
    select
      p.prize_id,
      p.prize_nm,
      p.prize_tp,
      p.total_qty,
      count(c.capsule_id) filter (where c.draw_yn = 'N')::integer as remain_qty,
      count(c.capsule_id) filter (where c.draw_yn = 'Y')::integer as drawn_qty,
      p.image_url,
      p.memo,
      p.sort_no
    from public.degul_capsule_prize p
    left join public.degul_capsule c
      on c.prize_id = p.prize_id
     and c.round_id = p.round_id
    where p.round_id = v_round.round_id
      and p.use_yn = 'Y'
    group by
      p.prize_id, p.prize_nm, p.prize_tp, p.total_qty,
      p.image_url, p.memo, p.sort_no
  ) x;

  return jsonb_build_object(
    'round', to_jsonb(v_round),
    'coin_balance', v_coin_balance,
    'remain_capsule_cnt', v_remain_capsule_cnt,
    'remain_prize_cnt', v_remain_prize_cnt,
    'prizes', v_prizes
  );
end;
$$;


create or replace function public.draw_capsule(
  p_round_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_round public.degul_capsule_round%rowtype;
  v_capsule public.degul_capsule%rowtype;
  v_prize public.degul_capsule_prize%rowtype;
  v_coin_balance integer;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- 같은 사용자의 중복 클릭과 동시 요청을 직렬화한다.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_round_id::text, 0)
  );

  select r.*
    into v_round
    from public.degul_capsule_round r
   where r.round_id = p_round_id
     and r.use_yn = 'Y'
   for update;

  if not found then
    raise exception '뽑기 회차가 없습니다.';
  end if;

  if v_round.status <> 'OPN'
     or (current_timestamp at time zone 'Asia/Seoul')::date
        not between v_round.start_dt and v_round.end_dt then
    raise exception '현재 진행 중인 뽑기가 아닙니다.';
  end if;

  select coalesce(sum(h.coin_qty), 0)::integer
    into v_coin_balance
    from public.degul_capsule_coin_history h
   where h.user_id = v_user_id
     and h.round_id = p_round_id;

  if v_coin_balance < 1 then
    raise exception '보유 코인이 부족합니다.';
  end if;

  select c.*
    into v_capsule
    from public.degul_capsule c
   where c.round_id = p_round_id
     and c.draw_yn = 'N'
   order by random()
   limit 1
   for update skip locked;

  if not found then
    raise exception '남은 캡슐이 없습니다.';
  end if;

  update public.degul_capsule
     set draw_yn = 'Y',
         drawn_by = v_user_id,
         drawn_at = now()
   where capsule_id = v_capsule.capsule_id;

  insert into public.degul_capsule_coin_history (
    user_id,
    round_id,
    capsule_id,
    coin_tp,
    coin_qty,
    memo,
    created_by
  )
  values (
    v_user_id,
    p_round_id,
    v_capsule.capsule_id,
    'DRAW',
    -1,
    '캡슐 뽑기 사용',
    v_user_id
  );

  select p.*
    into v_prize
    from public.degul_capsule_prize p
   where p.prize_id = v_capsule.prize_id
     and p.round_id = p_round_id;

  return jsonb_build_object(
    'capsule_id', v_capsule.capsule_id,
    'capsule_no', v_capsule.capsule_no,
    'prize_id', v_prize.prize_id,
    'prize_nm', v_prize.prize_nm,
    'prize_tp', v_prize.prize_tp,
    'image_url', v_prize.image_url,
    'memo', v_prize.memo,
    'coin_balance', v_coin_balance - 1
  );
end;
$$;


create or replace function public.get_my_capsule_history(
  p_round_id bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_coin_history jsonb;
  v_draw_history jsonb;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'coin_history_id', h.coin_history_id,
        'round_id', h.round_id,
        'round_nm', r.round_nm,
        'coin_tp', h.coin_tp,
        'coin_qty', h.coin_qty,
        'memo', h.memo,
        'created_at', h.created_at
      )
      order by h.created_at desc, h.coin_history_id desc
    ),
    '[]'::jsonb
  )
  into v_coin_history
  from public.degul_capsule_coin_history h
  join public.degul_capsule_round r on r.round_id = h.round_id
  where h.user_id = v_user_id
    and (p_round_id is null or h.round_id = p_round_id);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'capsule_id', c.capsule_id,
        'round_id', c.round_id,
        'round_nm', r.round_nm,
        'capsule_no', c.capsule_no,
        'prize_nm', p.prize_nm,
        'prize_tp', p.prize_tp,
        'image_url', p.image_url,
        'drawn_at', c.drawn_at
      )
      order by c.drawn_at desc, c.capsule_id desc
    ),
    '[]'::jsonb
  )
  into v_draw_history
  from public.degul_capsule c
  join public.degul_capsule_round r on r.round_id = c.round_id
  join public.degul_capsule_prize p
    on p.prize_id = c.prize_id
   and p.round_id = c.round_id
  where c.drawn_by = v_user_id
    and (p_round_id is null or c.round_id = p_round_id);

  return jsonb_build_object(
    'coin_history', v_coin_history,
    'draw_history', v_draw_history
  );
end;
$$;


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

create or replace function public.admin_create_capsule_round(
  p_round_year integer,
  p_round_no integer,
  p_round_nm text,
  p_start_dt date,
  p_end_dt date,
  p_memo text,
  p_prizes jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round_id bigint;
  v_total_capsule_cnt integer;
  v_prize_count integer;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_round_year not between 2020 and 2100 then
    raise exception '회차 연도가 올바르지 않습니다.';
  end if;

  if p_round_no <= 0 then
    raise exception '회차 번호는 1 이상이어야 합니다.';
  end if;

  if nullif(trim(p_round_nm), '') is null then
    raise exception '회차명을 입력해주세요.';
  end if;

  if p_start_dt is null or p_end_dt is null or p_start_dt > p_end_dt then
    raise exception '진행 기간이 올바르지 않습니다.';
  end if;

  if p_prizes is null
     or jsonb_typeof(p_prizes) <> 'array'
     or jsonb_array_length(p_prizes) = 0 then
    raise exception '상품을 한 개 이상 등록해주세요.';
  end if;

  select
    count(*)::integer,
    coalesce(sum(x.total_qty), 0)::integer
  into v_prize_count, v_total_capsule_cnt
  from jsonb_to_recordset(p_prizes) as x(
    prize_nm text,
    prize_tp text,
    total_qty integer,
    sort_no integer,
    image_url text,
    memo text
  );

  if v_prize_count = 0 or v_total_capsule_cnt <= 0 then
    raise exception '전체 캡슐 수량은 1개 이상이어야 합니다.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_prizes) as x(
      prize_nm text,
      prize_tp text,
      total_qty integer,
      sort_no integer,
      image_url text,
      memo text
    )
    where nullif(trim(x.prize_nm), '') is null
       or x.prize_tp not in ('PRIZE', 'LOSE')
       or x.total_qty is null
       or x.total_qty <= 0
  ) then
    raise exception '상품명, 상품 유형 또는 수량이 올바르지 않습니다.';
  end if;

  if not exists (
    select 1
    from jsonb_to_recordset(p_prizes) as x(
      prize_nm text,
      prize_tp text,
      total_qty integer,
      sort_no integer,
      image_url text,
      memo text
    )
    where x.prize_tp = 'LOSE'
  ) then
    raise exception '꽝 상품을 한 개 이상 등록해주세요.';
  end if;

  insert into public.degul_capsule_round (
    round_year,
    round_no,
    round_nm,
    start_dt,
    end_dt,
    total_capsule_cnt,
    status,
    use_yn,
    memo,
    created_by
  )
  values (
    p_round_year,
    p_round_no,
    trim(p_round_nm),
    p_start_dt,
    p_end_dt,
    v_total_capsule_cnt,
    'RDY',
    'Y',
    nullif(trim(p_memo), ''),
    auth.uid()
  )
  returning round_id into v_round_id;

  insert into public.degul_capsule_prize (
    round_id,
    prize_nm,
    prize_tp,
    total_qty,
    sort_no,
    image_url,
    memo,
    use_yn,
    created_by
  )
  select
    v_round_id,
    trim(x.prize_nm),
    x.prize_tp,
    x.total_qty,
    coalesce(x.sort_no, row_number() over ()::integer * 10),
    nullif(trim(x.image_url), ''),
    nullif(trim(x.memo), ''),
    'Y',
    auth.uid()
  from jsonb_to_recordset(p_prizes) as x(
    prize_nm text,
    prize_tp text,
    total_qty integer,
    sort_no integer,
    image_url text,
    memo text
  );

  return v_round_id;
exception
  when unique_violation then
    raise exception '%년 %회차가 이미 등록되어 있습니다.', p_round_year, p_round_no;
end;
$$;


create or replace function public.admin_start_capsule_round(
  p_round_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_capsule_cnt integer;
  v_prize_total_qty integer;
  v_existing_count integer;
  v_inserted_count integer;
  v_status varchar(3);
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select r.total_capsule_cnt, r.status
    into v_total_capsule_cnt, v_status
    from public.degul_capsule_round r
   where r.round_id = p_round_id
     and r.use_yn = 'Y'
   for update;

  if not found then
    raise exception '회차가 없습니다.';
  end if;

  if v_status <> 'RDY' then
    raise exception '준비 상태의 회차만 시작할 수 있습니다.';
  end if;

  select coalesce(sum(p.total_qty), 0)::integer
    into v_prize_total_qty
    from public.degul_capsule_prize p
   where p.round_id = p_round_id
     and p.use_yn = 'Y';

  if v_prize_total_qty <> v_total_capsule_cnt then
    raise exception
      '상품 수량 합계(%)와 총 캡슐 수(%)가 다릅니다.',
      v_prize_total_qty, v_total_capsule_cnt;
  end if;

  select count(*)::integer
    into v_existing_count
    from public.degul_capsule c
   where c.round_id = p_round_id;

  if v_existing_count > 0 then
    raise exception '이미 생성된 캡슐이 있습니다.';
  end if;

  insert into public.degul_capsule (
    round_id, capsule_no, prize_id, draw_yn, created_at
  )
  select
    p_round_id,
    row_number() over (order by x.random_value)::integer,
    x.prize_id,
    'N',
    now()
  from (
    select p.prize_id, random() as random_value
      from public.degul_capsule_prize p
      cross join lateral generate_series(1, p.total_qty)
     where p.round_id = p_round_id
       and p.use_yn = 'Y'
  ) x;

  get diagnostics v_inserted_count = row_count;

  if v_inserted_count <> v_total_capsule_cnt then
    raise exception '캡슐 생성 수가 올바르지 않습니다.';
  end if;

  update public.degul_capsule_round
     set status = 'OPN',
         updated_at = now(),
         updated_by = auth.uid()
   where round_id = p_round_id;

  return jsonb_build_object(
    'round_id', p_round_id,
    'generated_capsule_cnt', v_inserted_count,
    'status', 'OPN'
  );
end;
$$;


create or replace function public.admin_grant_capsule_coin(
  p_user_id uuid,
  p_round_id bigint,
  p_coin_qty integer,
  p_memo text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history_id bigint;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_coin_qty = 0 then
    raise exception '코인 수량은 0일 수 없습니다.';
  end if;

  insert into public.degul_capsule_coin_history (
    user_id, round_id, coin_tp, coin_qty, memo, created_by
  )
  values (
    p_user_id, p_round_id, 'ADMIN', p_coin_qty, p_memo, auth.uid()
  )
  returning coin_history_id into v_history_id;

  return v_history_id;
end;
$$;

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
     where m.meeting_id = p_meeting_id
       and m.use_yn = 'Y'
  ) then
    raise exception '모임이 없습니다.';
  end if;

  insert into public.degul_capsule_coin_history (
    user_id,
    round_id,
    meeting_id,
    coin_tp,
    coin_qty,
    memo,
    created_by
  )
  select
    a.user_id,
    p_round_id,
    p_meeting_id,
    'ATD',
    1,
    '모임 참석 코인 지급',
    auth.uid()
  from public.degul_attendance a
  where a.meeting_id = p_meeting_id
    and a.attendance_tp in ('ATD', 'LAT')
  on conflict (user_id, round_id, meeting_id)
    where coin_tp = 'ATD'
    do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;


revoke all on function public.get_capsule_dashboard(bigint) from public;
revoke all on function public.draw_capsule(bigint) from public;
revoke all on function public.get_my_capsule_history(bigint) from public;
revoke all on function public.admin_get_capsule_rounds() from public;
revoke all on function public.admin_create_capsule_round(integer, integer, text, date, date, text, jsonb) from public;
revoke all on function public.admin_start_capsule_round(bigint) from public;
revoke all on function public.admin_grant_capsule_coin(uuid, bigint, integer, text) from public;
revoke all on function public.admin_grant_attendance_capsule_coins(bigint, uuid) from public;

grant execute on function public.get_capsule_dashboard(bigint) to authenticated;
grant execute on function public.draw_capsule(bigint) to authenticated;
grant execute on function public.get_my_capsule_history(bigint) to authenticated;
grant execute on function public.admin_get_capsule_rounds() to authenticated;
grant execute on function public.admin_create_capsule_round(integer, integer, text, date, date, text, jsonb) to authenticated;
grant execute on function public.admin_start_capsule_round(bigint) to authenticated;
grant execute on function public.admin_grant_capsule_coin(uuid, bigint, integer, text) to authenticated;
grant execute on function public.admin_grant_attendance_capsule_coins(bigint, uuid) to authenticated;
