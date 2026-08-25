-- 포인트 이력은 기존 RLS를 유지하면서, 현재 연승 수만 로그인 회원에게 공개한다.
create or replace function public.get_battle_current_streaks()
returns table (
  user_id uuid,
  current_streak integer
)
language sql
stable
security definer
set search_path = public
as $$
  with participant_events as (
    select
      bh.user1_id as user_id,
      m.meeting_dt,
      bh.game_no,
      bh.battle_id,
      (
        bh.bye_yn = 'N'
        and bh.winner_user_id = bh.user1_id
      ) as is_normal_win
    from public.degul_battle_history bh
    join public.degul_meeting m
      on m.meeting_id = bh.meeting_id
    where bh.result_confirm_yn = 'Y'
      and bh.user1_id is not null

    union all

    select
      bh.user2_id as user_id,
      m.meeting_dt,
      bh.game_no,
      bh.battle_id,
      (
        bh.bye_yn = 'N'
        and bh.winner_user_id = bh.user2_id
      ) as is_normal_win
    from public.degul_battle_history bh
    join public.degul_meeting m
      on m.meeting_id = bh.meeting_id
    where bh.result_confirm_yn = 'Y'
      and bh.user2_id is not null
  ),
  streak_events as (
    select
      e.*,
      sum(case when e.is_normal_win then 0 else 1 end) over (
        partition by e.user_id
        order by e.meeting_dt desc, e.game_no desc, e.battle_id desc
        rows between unbounded preceding and current row
      ) as break_count
    from participant_events e
  )
  select
    u.id as user_id,
    coalesce(
      count(*) filter (
        where se.break_count = 0
          and se.is_normal_win
      ),
      0
    )::integer as current_streak
  from public.degul_users u
  left join streak_events se
    on se.user_id = u.id
  where u.status = 'ACT'
  group by u.id;
$$;

revoke all on function public.get_battle_current_streaks() from public, anon;
grant execute on function public.get_battle_current_streaks() to authenticated;

comment on function public.get_battle_current_streaks()
  is '로그인 회원에게 공개되는 현재 일반승리 연승 수. 패배, 무승부, 부전승은 연승을 종료한다.';
