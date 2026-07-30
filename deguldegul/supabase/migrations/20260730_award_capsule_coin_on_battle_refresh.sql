-- 정기전 배틀로얄 결과 최신화 과정에서 ATD 포인트가 최초 생성되면
-- 해당 이벤트 회차의 코인 1개를 같은 트랜잭션에서 지급한다.

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

  -- 정기전이며 실제 배틀 참가를 선택한 참석자만 지급한다.
  if not exists (
    select 1
      from public.degul_meeting m
      join public.degul_attendance a
        on a.meeting_id = m.meeting_id
       and a.user_id = new.user_id
     where m.meeting_id = new.meeting_id
       and m.meeting_tp = 'REG'
       and coalesce(m.use_yn, 'Y') = 'Y'
       and a.attendance_tp in ('ATD', 'LAT')
       and a.battle_join_yn = 'Y'
  ) then
    return new;
  end if;

  -- 모임 날짜가 포함된 진행 회차에 코인을 귀속한다.
  select r.round_id
    into v_round_id
    from public.degul_capsule_round r
    join public.degul_meeting m
      on m.meeting_id = new.meeting_id
   where r.use_yn = 'Y'
     and r.status = 'OPN'
     and m.meeting_dt::date between r.start_dt and r.end_dt
   order by r.start_dt desc, r.round_id desc
   limit 1;

  -- 해당 모임에 대응하는 진행 회차가 없으면 결과 계산은 그대로 진행한다.
  if v_round_id is null then
    return new;
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
  values (
    new.user_id,
    v_round_id,
    new.meeting_id,
    'ATD',
    1,
    '정기전 배틀로얄 참가 코인 지급',
    auth.uid()
  )
  on conflict (user_id, round_id, meeting_id)
    where coin_tp = 'ATD'
    do nothing;

  return new;
end;
$$;

drop trigger if exists trg_award_capsule_coin_on_battle_attendance
  on public.degul_point_history;

create trigger trg_award_capsule_coin_on_battle_attendance
after insert on public.degul_point_history
for each row
when (new.point_tp = 'ATD')
execute function public.award_capsule_coin_on_battle_attendance();

revoke all on function public.award_capsule_coin_on_battle_attendance()
  from public;


-- 이미 결과 최신화가 끝나 ATD 포인트가 생성된 모임에 한해 선택적으로 실행할 백필 함수.
-- 기본 배포만으로는 과거 건을 자동 지급하지 않는다.
create or replace function public.admin_backfill_battle_capsule_coins(
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
      join public.degul_meeting m
        on m.meeting_id = p_meeting_id
     where r.round_id = p_round_id
       and r.use_yn = 'Y'
       and m.meeting_tp = 'REG'
       and m.meeting_dt::date between r.start_dt and r.end_dt
  ) then
    raise exception '회차 기간과 정기전 날짜가 일치하지 않습니다.';
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
    '정기전 배틀로얄 참가 코인 지급(백필)',
    auth.uid()
  from public.degul_attendance a
  where a.meeting_id = p_meeting_id
    and a.attendance_tp in ('ATD', 'LAT')
    and a.battle_join_yn = 'Y'
    and exists (
      select 1
        from public.degul_point_history ph
       where ph.meeting_id = p_meeting_id
         and ph.user_id = a.user_id
         and ph.point_tp = 'ATD'
    )
  on conflict (user_id, round_id, meeting_id)
    where coin_tp = 'ATD'
    do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

revoke all on function public.admin_backfill_battle_capsule_coins(bigint, uuid)
  from public;

grant execute on function public.admin_backfill_battle_capsule_coins(bigint, uuid)
  to authenticated;
