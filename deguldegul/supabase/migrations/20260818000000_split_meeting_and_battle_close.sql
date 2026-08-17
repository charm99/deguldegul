-- 예약 인원 마감, 배틀 대진 확정, 모임 완료를 서로 분리한다.
alter table public.degul_meeting
  add column if not exists attendance_closed_at timestamptz,
  add column if not exists battle_generated_at timestamptz;

comment on column public.degul_meeting.attendance_closed_at
  is '볼링장 예약을 위한 일반 참석자 마감 시각';
comment on column public.degul_meeting.battle_generated_at
  is '배틀 참가 확정 및 대진표 최초 생성 시각';

create or replace function public.can_manage_meeting(p_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.degul_users u
     where u.id = auth.uid()
       and u.role in ('STF', 'MGR', 'ADM')
  ) or exists (
    select 1
      from public.degul_meeting m
     where m.meeting_id = p_meeting_id
       and m.meeting_tp = 'FLS'
       and m.created_by = auth.uid()
  );
$$;

revoke all on function public.can_manage_meeting(uuid) from public;

create or replace function public.close_meeting_attendance(p_meeting_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed_at timestamptz;
begin
  if auth.uid() is null or not public.can_manage_meeting(p_meeting_id) then
    raise exception '모임 참석자를 마감할 권한이 없습니다.';
  end if;

  update public.degul_meeting
     set attendance_closed_at = coalesce(attendance_closed_at, now()),
         updated_at = now()
   where meeting_id = p_meeting_id
     and status = 'OPN'
     and use_yn = 'Y'
  returning attendance_closed_at into v_closed_at;

  if not found then
    raise exception '모집 중인 모임을 찾을 수 없습니다.';
  end if;

  return v_closed_at;
end;
$$;

create or replace function public.reopen_meeting_attendance(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_manage_meeting(p_meeting_id) then
    raise exception '참석자 마감을 취소할 권한이 없습니다.';
  end if;

  update public.degul_meeting
     set attendance_closed_at = null,
         updated_at = now()
   where meeting_id = p_meeting_id
     and status = 'OPN'
     and battle_generated_at is null;

  if not found then
    raise exception '대진표 생성 전인 모집 중 모임만 다시 열 수 있습니다.';
  end if;
end;
$$;

create or replace function public.update_my_battle_join(
  p_meeting_id uuid,
  p_battle_join_yn char(1)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_battle_join_yn is null or p_battle_join_yn not in ('Y', 'N') then
    raise exception '배틀 참가 여부는 Y 또는 N이어야 합니다.';
  end if;

  if not exists (
    select 1
      from public.degul_meeting m
     where m.meeting_id = p_meeting_id
       and m.status = 'OPN'
       and m.use_yn = 'Y'
       and m.attendance_closed_at is not null
       and m.battle_generated_at is null
  ) then
    raise exception '현재 배틀 참가 여부를 변경할 수 없습니다.';
  end if;

  update public.degul_attendance
     set battle_join_yn = p_battle_join_yn,
         updated_at = now()
   where meeting_id = p_meeting_id
     and user_id = auth.uid()
     and attendance_tp in ('ATD', 'LAT');

  if not found then
    raise exception '참석 또는 늦참 회원만 배틀에 참가할 수 있습니다.';
  end if;
end;
$$;

create or replace function public.finalize_battle_matches(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_battle_member_count integer;
begin
  if auth.uid() is null or not public.can_manage_meeting(p_meeting_id) then
    raise exception '배틀 대진표를 생성할 권한이 없습니다.';
  end if;

  perform 1
    from public.degul_meeting m
   where m.meeting_id = p_meeting_id
     and m.status = 'OPN'
     and m.use_yn = 'Y'
     and m.attendance_closed_at is not null
     and m.battle_generated_at is null
   for update;

  if not found then
    raise exception '참석자 마감 후 대진표가 생성되지 않은 모임만 처리할 수 있습니다.';
  end if;

  if exists (
    select 1 from public.degul_battle_history b where b.meeting_id = p_meeting_id
  ) then
    raise exception '이미 생성된 대진표가 있습니다.';
  end if;

  select count(*)::integer
    into v_battle_member_count
    from public.degul_attendance a
   where a.meeting_id = p_meeting_id
     and a.attendance_tp in ('ATD', 'LAT')
     and a.battle_join_yn = 'Y';

  if v_battle_member_count < 2 then
    raise exception '배틀 참가자가 2명 이상이어야 합니다.';
  end if;

  perform public.generate_battle_matches(p_meeting_id);

  update public.degul_meeting
     set battle_generated_at = now(),
         updated_at = now()
   where meeting_id = p_meeting_id;
end;
$$;

create or replace function public.complete_meeting(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_manage_meeting(p_meeting_id) then
    raise exception '모임을 완료할 권한이 없습니다.';
  end if;

  update public.degul_meeting
     set status = 'CLS',
         attendance_closed_at = coalesce(attendance_closed_at, now()),
         updated_at = now()
   where meeting_id = p_meeting_id
     and status = 'OPN'
     and use_yn = 'Y';

  if not found then
    raise exception '완료할 수 있는 모임이 없습니다.';
  end if;
end;
$$;

-- 참석자 마감 이후에는 일반 참석 정보는 잠그고 배틀 참가 여부만 허용한다.
create or replace function public.enforce_meeting_attendance_close()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting public.degul_meeting%rowtype;
begin
  select * into v_meeting
    from public.degul_meeting
   where meeting_id = new.meeting_id;

  if v_meeting.battle_generated_at is not null
     and (tg_op = 'INSERT' or new.battle_join_yn is distinct from old.battle_join_yn) then
    raise exception '대진표 생성 후에는 배틀 참가 여부를 변경할 수 없습니다.';
  end if;

  if v_meeting.attendance_closed_at is not null then
    if tg_op = 'INSERT' then
      raise exception '참석자 마감 후에는 새로 참석 신청할 수 없습니다.';
    end if;

    if new.attendance_tp is distinct from old.attendance_tp
       or new.memo is distinct from old.memo then
      raise exception '참석자 마감 후에는 일반 참석 정보를 변경할 수 없습니다.';
    end if;
  end if;

  if new.battle_join_yn = 'Y' and new.attendance_tp not in ('ATD', 'LAT') then
    raise exception '참석 또는 늦참 회원만 배틀에 참가할 수 있습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_meeting_attendance_close
  on public.degul_attendance;
create trigger trg_enforce_meeting_attendance_close
before insert or update on public.degul_attendance
for each row execute function public.enforce_meeting_attendance_close();

revoke all on function public.close_meeting_attendance(uuid) from public;
revoke all on function public.reopen_meeting_attendance(uuid) from public;
revoke all on function public.update_my_battle_join(uuid, char) from public;
revoke all on function public.finalize_battle_matches(uuid) from public;
revoke all on function public.complete_meeting(uuid) from public;

grant execute on function public.close_meeting_attendance(uuid) to authenticated;
grant execute on function public.reopen_meeting_attendance(uuid) to authenticated;
grant execute on function public.update_my_battle_join(uuid, char) to authenticated;
grant execute on function public.finalize_battle_matches(uuid) to authenticated;
grant execute on function public.complete_meeting(uuid) to authenticated;

-- 대진표 생성은 검증과 잠금을 수행하는 finalize_battle_matches로만 호출한다.
revoke execute on function public.generate_battle_matches(uuid) from public, authenticated;
