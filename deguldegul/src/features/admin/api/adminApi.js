import { supabase } from "../../../services/supabase";

export function fetchUsers() {
  return supabase.from("degul_users").select("*").order("created_at", { ascending: false });
}

export function updateUser(userId, values) {
  return supabase.rpc("admin_update_user", {
    p_user_id: userId,
    p_status: Object.hasOwn(values, "status") ? values.status : null,
    p_role: Object.hasOwn(values, "role") ? values.role : null,
    p_average_start_date: Object.hasOwn(values, "average_start_date") ? values.average_start_date : null,
  });
}

export async function fetchAverageManagementData() {
  const { data, error } = await supabase.rpc("get_admin_average_stats");
  return {
    data: (data || []).map((item) => ({
      ...item,
      game_count: Number(item.game_count || 0),
      avg_score: item.avg_score == null ? null : Number(item.avg_score),
      high_score: item.high_score == null ? null : Number(item.high_score),
      low_score: item.low_score == null ? null : Number(item.low_score),
      total_score: Number(item.total_score || 0),
    })),
    error,
  };
}

export async function resetUserPassword(userId) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."));
    }, 15000);
  });

  let result;
  try {
    result = await Promise.race([
      supabase.functions.invoke("admin-reset-password", {
        body: { userId },
      }),
      timeout,
    ]);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (result.error?.context instanceof Response) {
    try {
      const body = await result.error.context.json();
      return { ...result, error: new Error(body.error || result.error.message) };
    } catch {
      // Keep the SDK error when the response does not contain JSON.
    }
  }

  return result;
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

export async function fetchMonthlyAttendanceStatus(startDate, endDate) {
  const [userResult, attendanceResult] = await Promise.all([
    supabase
      .from("degul_users")
      .select("id, name, nickname")
      .eq("status", "ACT")
      .order("name"),
    supabase
      .from("degul_attendance")
      .select(`
        user_id, attendance_tp,
        meeting:meeting_id!inner (meeting_id, meeting_nm, meeting_tp, meeting_dt, status)
      `)
      .in("attendance_tp", ["ATD", "LAT"])
      .eq("meeting.status", "CLS")
      .gte("meeting.meeting_dt", startDate)
      .lt("meeting.meeting_dt", endDate),
  ]);

  const error = userResult.error || attendanceResult.error;
  return {
    data: error
      ? null
      : {
          users: userResult.data || [],
          attendances: attendanceResult.data || [],
        },
    error,
  };
}
