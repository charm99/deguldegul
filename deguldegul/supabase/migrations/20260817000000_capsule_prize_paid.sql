-- 캡슐 당첨 상품의 지급 여부와 처리 시각을 관리한다.
alter table public.degul_capsule
  add column if not exists prize_paid_yn char(1) not null default 'N',
  add column if not exists prize_paid_at timestamptz;

alter table public.degul_capsule
  drop constraint if exists chk_capsule_prize_paid_yn;
alter table public.degul_capsule
  add constraint chk_capsule_prize_paid_yn
  check (prize_paid_yn in ('Y', 'N'));

comment on column public.degul_capsule.prize_paid_yn
  is '당첨 상품 지급 여부 (Y: 지급 완료, N: 미지급)';
comment on column public.degul_capsule.prize_paid_at
  is '당첨 상품 지급 완료 처리 시각';

create or replace function public.admin_update_capsule_prize_paid(
  p_capsule_id bigint,
  p_paid_yn char(1)
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capsule public.degul_capsule%rowtype;
begin
  if auth.uid() is null or not public.is_degul_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_paid_yn is null or p_paid_yn not in ('Y', 'N') then
    raise exception '지급 여부는 Y 또는 N이어야 합니다.';
  end if;

  update public.degul_capsule c
     set prize_paid_yn = p_paid_yn,
         prize_paid_at = case when p_paid_yn = 'Y' then now() else null end
    from public.degul_capsule_prize p
   where c.capsule_id = p_capsule_id
     and p.prize_id = c.prize_id
     and p.round_id = c.round_id
     and c.draw_yn = 'Y'
     and p.prize_tp = 'PRIZE'
  returning c.* into v_capsule;

  if not found then
    raise exception '지급 처리할 당첨 내역이 없습니다.';
  end if;

  return jsonb_build_object(
    'capsule_id', v_capsule.capsule_id,
    'prize_paid_yn', v_capsule.prize_paid_yn,
    'prize_paid_at', v_capsule.prize_paid_at
  );
end;
$$;

revoke all on function public.admin_update_capsule_prize_paid(bigint, char) from public;
grant execute on function public.admin_update_capsule_prize_paid(bigint, char) to authenticated;

-- 기존 관리자 조회 결과에 지급 상태를 포함한다.
create or replace function public.admin_get_capsule_history(p_round_id bigint)
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
    select 1 from public.degul_capsule_round r where r.round_id = p_round_id
  ) then
    raise exception '회차가 없습니다.';
  end if;

  select coalesce(
    jsonb_agg(jsonb_build_object(
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
    ) order by h.created_at desc, h.coin_history_id desc), '[]'::jsonb)
  into v_coin_history
  from public.degul_capsule_coin_history h
  join public.degul_users u on u.id = h.user_id
  left join public.degul_meeting m on m.meeting_id = h.meeting_id
  where h.round_id = p_round_id;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'capsule_id', c.capsule_id,
      'capsule_no', c.capsule_no,
      'user_id', c.drawn_by,
      'user_name', u.name,
      'nickname', u.nickname,
      'prize_id', p.prize_id,
      'prize_nm', p.prize_nm,
      'memo', p.memo,
      'image_url', p.image_url,
      'drawn_at', c.drawn_at,
      'prize_paid_yn', c.prize_paid_yn,
      'prize_paid_at', c.prize_paid_at
    ) order by c.drawn_at desc, c.capsule_id desc), '[]'::jsonb)
  into v_winner_history
  from public.degul_capsule c
  join public.degul_capsule_prize p
    on p.prize_id = c.prize_id and p.round_id = c.round_id
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

revoke all on function public.admin_get_capsule_history(bigint) from public;
grant execute on function public.admin_get_capsule_history(bigint) to authenticated;
