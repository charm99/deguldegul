-- 공통코드는 로그인/회원가입 화면에서도 사용하므로 활성 코드의 읽기를 허용한다.
alter table public.degul_comm_cd enable row level security;

grant select on table public.degul_comm_cd to anon, authenticated;

drop policy if exists "read active common codes" on public.degul_comm_cd;

create policy "read active common codes"
on public.degul_comm_cd
for select
to anon, authenticated
using (trim(use_yn) = 'Y');
