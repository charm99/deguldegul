-- 2026-08-01 KST 날짜 경계 오류로 누락된 코인을 검토 후 수동 복구한다.
-- 먼저 아래 SELECT 결과를 확인한 다음, 동일한 트랜잭션 안의 INSERT를 실행한다.
begin;

create temporary table capsule_coin_backfill_candidates on commit drop as
select distinct
  a.user_id,
  matched_round.round_id,
  m.meeting_id
from public.degul_meeting m
join public.degul_attendance a
  on a.meeting_id = m.meeting_id
cross join lateral (
  select r.round_id
    from public.degul_capsule_round r
   where r.use_yn = 'Y'
     and r.status = 'OPN'
     and (m.meeting_dt at time zone 'Asia/Seoul')::date
         between r.start_dt and r.end_dt
   order by r.start_dt desc, r.round_id desc
   limit 1
) matched_round
where coalesce(m.use_yn, 'Y') = 'Y'
  and (m.meeting_dt at time zone 'Asia/Seoul')::date = date '2026-08-01'
  and a.attendance_tp in ('ATD', 'LAT')
  and a.battle_join_yn = 'Y'
  and exists (
    select 1
      from public.degul_point_history ph
     where ph.meeting_id = m.meeting_id
       and ph.user_id = a.user_id
       and ph.point_tp = 'ATD'
  )
  and not exists (
    select 1
      from public.degul_capsule_coin_history h
     where h.user_id = a.user_id
       and h.round_id = matched_round.round_id
       and h.meeting_id = m.meeting_id
       and h.coin_tp = 'ATD'
  );

-- 실행 전 검토 대상
select *
  from capsule_coin_backfill_candidates
 order by meeting_id, user_id;

insert into public.degul_capsule_coin_history (
  user_id, round_id, meeting_id, coin_tp, coin_qty, memo, created_by
)
select
  user_id,
  round_id,
  meeting_id,
  'ATD',
  1,
  '배틀로얄 참가 코인 지급(KST 날짜 보정)',
  null
from capsule_coin_backfill_candidates
on conflict (user_id, round_id, meeting_id)
  where coin_tp = 'ATD'
  do nothing;

-- 검토만 할 때는 rollback, 실제 반영할 때는 commit으로 바꾼다.
rollback;
