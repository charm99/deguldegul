import { supabase } from "../../../services/supabase";

export function fetchUsers() {
  return supabase.from("degul_users").select("*").order("created_at", { ascending: false });
}

export function updateUser(userId, values) {
  return supabase.from("degul_users").update(values).eq("id", userId);
}

export function fetchBattlePointHistory() {
  return supabase
    .from("degul_point_history")
    .select(`
      point_hist_id, user_id, meeting_id, battle_id, point_tp, point, memo, created_at,
      user:user_id (name, nickname),
      meeting:meeting_id (meeting_nm, meeting_dt)
    `)
    .order("created_at", { ascending: false });
}

export function fetchMonthlyBattleAttendances(startDate, endDate) {
  return supabase
    .from("degul_attendance")
    .select(`
      meeting_id, user_id,
      user:user_id (name, nickname),
      meeting:meeting_id!inner (meeting_dt, status)
    `)
    .eq("battle_join_yn", "Y")
    .in("attendance_tp", ["ATD", "LAT"])
    .eq("meeting.status", "CLS")
    .gte("meeting.meeting_dt", startDate)
    .lt("meeting.meeting_dt", endDate);
}

export function refreshBattleResults() {
  return supabase.rpc("refresh_battle_results");
}
