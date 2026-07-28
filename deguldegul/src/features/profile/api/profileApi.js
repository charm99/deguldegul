import { supabase } from "../../../services/supabase";

export function fetchPointHistory(userId) {
  return supabase
    .from("degul_point_history")
    .select(`
      point_hist_id, point_tp, point, memo, created_at,
      meeting:meeting_id (meeting_nm, meeting_dt)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}
