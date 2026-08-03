create table if not exists public.degul_meeting_lane_plan (
  meeting_id uuid primary key references public.degul_meeting(meeting_id) on delete cascade,
  lane_count integer not null check (lane_count >= 2 and lane_count % 2 = 0),
  assignment_method text not null check (assignment_method in ('RND', 'SCR')),
  created_by uuid not null references public.degul_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.degul_meeting_lane_assignment (
  assignment_id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.degul_meeting(meeting_id) on delete cascade,
  user_id uuid not null references public.degul_users(id),
  table_no integer not null check (table_no > 0),
  lane_no integer not null check (lane_no > 0),
  avg_score numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (meeting_id, user_id)
);

create index if not exists idx_meeting_lane_assignment_meeting_lane
  on public.degul_meeting_lane_assignment(meeting_id, lane_no);

alter table public.degul_meeting_lane_plan enable row level security;
alter table public.degul_meeting_lane_assignment enable row level security;

drop policy if exists "authenticated read meeting lane plan"
  on public.degul_meeting_lane_plan;
create policy "authenticated read meeting lane plan"
  on public.degul_meeting_lane_plan
  for select to authenticated
  using (true);

drop policy if exists "authenticated read meeting lane assignment"
  on public.degul_meeting_lane_assignment;
create policy "authenticated read meeting lane assignment"
  on public.degul_meeting_lane_assignment
  for select to authenticated
  using (true);

create or replace function public.admin_save_meeting_lane_assignment(
  p_meeting_id uuid,
  p_lane_count integer,
  p_assignment_method text,
  p_assignments jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if not exists (
    select 1
      from public.degul_users u
     where u.id = v_user_id
       and u.role in ('STF', 'MGR', 'ADM')
  ) then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_lane_count < 2 or p_lane_count % 2 <> 0 then
    raise exception '레인 수는 2 이상의 짝수여야 합니다.';
  end if;

  if p_assignment_method not in ('RND', 'SCR') then
    raise exception '지원하지 않는 편성 기준입니다.';
  end if;

  insert into public.degul_meeting_lane_plan (
    meeting_id, lane_count, assignment_method, created_by
  )
  values (
    p_meeting_id, p_lane_count, p_assignment_method, v_user_id
  )
  on conflict (meeting_id) do update
    set lane_count = excluded.lane_count,
        assignment_method = excluded.assignment_method,
        created_by = excluded.created_by,
        updated_at = now();

  delete from public.degul_meeting_lane_assignment
   where meeting_id = p_meeting_id;

  insert into public.degul_meeting_lane_assignment (
    meeting_id, user_id, table_no, lane_no, avg_score
  )
  select
    p_meeting_id,
    x.user_id,
    x.table_no,
    x.lane_no,
    x.avg_score
  from jsonb_to_recordset(coalesce(p_assignments, '[]'::jsonb))
    as x(user_id uuid, table_no integer, lane_no integer, avg_score numeric);
end;
$$;

revoke all on function public.admin_save_meeting_lane_assignment(
  uuid, integer, text, jsonb
) from public;
grant execute on function public.admin_save_meeting_lane_assignment(
  uuid, integer, text, jsonb
) to authenticated;

create or replace function public.admin_set_meeting_attendee(
  p_meeting_id uuid,
  p_user_id uuid,
  p_attending boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.degul_users u
     where u.id = auth.uid()
       and u.role in ('STF', 'MGR', 'ADM')
  ) then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  if p_attending then
    insert into public.degul_attendance (
      meeting_id, user_id, attendance_tp, updated_at
    )
    values (
      p_meeting_id, p_user_id, 'ATD', now()
    )
    on conflict (meeting_id, user_id) do update
      set attendance_tp = 'ATD',
          updated_at = now();
  else
    update public.degul_attendance
       set attendance_tp = 'ABS',
           battle_join_yn = 'N',
           updated_at = now()
     where meeting_id = p_meeting_id
       and user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.admin_set_meeting_attendee(
  uuid, uuid, boolean
) from public;
grant execute on function public.admin_set_meeting_attendee(
  uuid, uuid, boolean
) to authenticated;
