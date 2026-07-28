import { supabase } from "../../../services/supabase";

export function fetchCenterManagers() {
  return supabase
    .from("degul_users")
    .select("id, name, nickname, phone_no, role, status")
    .in("role", ["ADM", "MGR", "STF"])
    .eq("status", "ACT")
    .order("name");
}

export function fetchCentersForAdmin() {
  return supabase
    .from("degul_center")
    .select(`
      center_id, center_nm, address, center_tel_no, manager_user_id,
      bank_nm, account_no, account_holder, game_cost, fixed_week_nos,
      fixed_weekday, fixed_time, use_yn,
      manager:manager_user_id (id, name, nickname, phone_no)
    `)
    .order("created_at", { ascending: true });
}

export function saveCenter(centerId, payload) {
  return centerId
    ? supabase.from("degul_center").update(payload).eq("center_id", centerId)
    : supabase.from("degul_center").insert(payload);
}
