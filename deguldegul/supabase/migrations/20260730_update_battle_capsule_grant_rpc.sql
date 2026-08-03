-- 캡슐 이벤트 도입 이후 수동 참석 코인 지급 대상을
-- 모임 유형과 무관하게 배틀로얄 실제 참가자로 제한한다.
-- 과거 참석 내역은 소급 지급하지 않는다.

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
       and m.use_yn = 'Y'
       and (m.meeting_dt at time zone 'Asia/Seoul')::date
           between r.start_dt and r.end_dt
  ) then
    raise exception '회차 기간에 포함된 유효한 모임이 아닙니다.';
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

revoke all on function public.admin_grant_attendance_capsule_coins(
  bigint, uuid
) from public;
grant execute on function public.admin_grant_attendance_capsule_coins(
  bigint, uuid
) to authenticated;
