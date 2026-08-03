-- 이미 배포된 관리자 당첨 내역 RPC에 상품 메모 필드를 추가한다.
create or replace function public.admin_get_capsule_history(
  p_round_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coin_history jsonb;
  v_winner_history jsonb;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if not exists (
    select 1
      from public.degul_capsule_round r
     where r.round_id = p_round_id
  ) then
    raise exception '회차가 없습니다.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'coin_history_id', h.coin_history_id,
        'user_id', h.user_id,
        'user_name', u.name,
        'nickname', u.nickname,
        'coin_tp', h.coin_tp,
        'coin_qty', h.coin_qty,
        'memo', h.memo,
        'meeting_id', h.meeting_id,
        'meeting_nm', m.meeting_nm,
        'created_at', h.created_at
      )
      order by h.created_at desc, h.coin_history_id desc
    ),
    '[]'::jsonb
  )
  into v_coin_history
  from public.degul_capsule_coin_history h
  join public.degul_users u on u.id = h.user_id
  left join public.degul_meeting m on m.meeting_id = h.meeting_id
  where h.round_id = p_round_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'capsule_id', c.capsule_id,
        'capsule_no', c.capsule_no,
        'user_id', c.drawn_by,
        'user_name', u.name,
        'nickname', u.nickname,
        'prize_id', p.prize_id,
        'prize_nm', p.prize_nm,
        'memo', p.memo,
        'image_url', p.image_url,
        'drawn_at', c.drawn_at
      )
      order by c.drawn_at desc, c.capsule_id desc
    ),
    '[]'::jsonb
  )
  into v_winner_history
  from public.degul_capsule c
  join public.degul_capsule_prize p
    on p.prize_id = c.prize_id
   and p.round_id = c.round_id
  join public.degul_users u on u.id = c.drawn_by
  where c.round_id = p_round_id
    and c.draw_yn = 'Y'
    and p.prize_tp = 'PRIZE';

  return jsonb_build_object(
    'coin_history', v_coin_history,
    'winner_history', v_winner_history
  );
end;
$$;

revoke all on function public.admin_get_capsule_history(bigint)
  from public;
grant execute on function public.admin_get_capsule_history(bigint)
  to authenticated;
