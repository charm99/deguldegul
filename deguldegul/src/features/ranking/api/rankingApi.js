import { supabase } from "../../../services/supabase";

export async function fetchPersonalStats(year) {
  const [statsResult, monthlyResult, recentResult] = await Promise.all([
    supabase.rpc("get_my_stats"),
    supabase.rpc("get_my_monthly_avg", { p_year: year }),
    supabase.rpc("get_my_recent_games", { p_limit: 5 }),
  ]);

  const error = statsResult.error || monthlyResult.error || recentResult.error;
  if (error) return { data: null, error };

  return {
    data: {
      stats: statsResult.data?.[0] || null,
      monthlyAverages: monthlyResult.data || [],
      recentGames: recentResult.data || [],
    },
    error: null,
  };
}

export async function fetchRankings(range, year) {
  const [scoreResult, attendanceResult] = await Promise.all([
    supabase.rpc("get_score_ranking", { p_range: range, p_year: year }),
    supabase.rpc("get_attendance_ranking", { p_range: range, p_year: year }),
  ]);

  const error = scoreResult.error || attendanceResult.error;
  if (error) return { data: null, error };

  return {
    data: {
      scores: scoreResult.data || [],
      attendances: attendanceResult.data || [],
    },
    error: null,
  };
}

export async function fetchBattleRanking() {
  const [rankingResult, streakResult] = await Promise.all([
    supabase.rpc("get_battle_ranking"),
    supabase.rpc("get_battle_current_streaks"),
  ]);

  const error = rankingResult.error || streakResult.error;
  if (error) return { data: null, error };

  const streakByUser = new Map(
    (streakResult.data || []).map((item) => [item.user_id, Number(item.current_streak || 0)])
  );

  return {
    data: (rankingResult.data || []).map((item) => ({
      ...item,
      current_streak: streakByUser.get(item.user_id) || 0,
    })),
    error: null,
  };
}

export function fetchBattlePointHistory(userId) {
  return supabase
    .from("degul_point_history")
    .select(`
      point_hist_id, user_id, point_tp, point, memo, created_at,
      meeting:meeting_id (meeting_nm, meeting_dt),
      battle:battle_id (
        battle_id, game_no, user1_id, user2_id,
        user1:user1_id (id, name, nickname),
        user2:user2_id (id, name, nickname)
      )
    `)
    .eq("user_id", userId);
}

export function fetchMyRecords() {
  return supabase.rpc("get_my_all_records");
}
