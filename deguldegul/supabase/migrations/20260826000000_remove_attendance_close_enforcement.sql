-- 실제 참석 결과 정정을 위해 관리자 참석자 관리는 모임 상태와 관계없이 허용한다.
-- 관리자 권한은 admin_set_meeting_attendee RPC 내부에서 계속 검사한다.
drop trigger if exists trg_enforce_meeting_attendance_close
  on public.degul_attendance;

drop function if exists public.enforce_meeting_attendance_close();
