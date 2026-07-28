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

export function fetchBattleRanking() {
  return supabase.rpc("get_battle_ranking");
}

export function fetchMyRecords() {
  return supabase.rpc("get_my_all_records");
}
