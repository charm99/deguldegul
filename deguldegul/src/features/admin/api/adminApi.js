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

export function refreshBattleResults() {
  return supabase.rpc("refresh_battle_results");
}
