import { supabase } from "../../../services/supabase";

export async function fetchHomeDashboard(userId) {
  const now = new Date().toISOString();
  const [meetingResult, boardResult, scoreResult] = await Promise.all([
    supabase
      .from("degul_meeting")
      .select(`
        meeting_id, meeting_nm, meeting_tp, meeting_dt, status, memo,
        center:center_id (center_nm, address, game_cost)
      `)
      .eq("use_yn", "Y")
      .neq("status", "CNL")
      .gte("meeting_dt", now)
      .order("meeting_dt", { ascending: true })
      .limit(3),
    supabase
      .from("degul_board")
      .select(`
        board_id, board_tp, title, created_at, view_cnt,
        writer:writer_id (name, nickname)
      `)
      .in("board_tp", ["NOT", "FRI"])
      .eq("use_yn", "Y")
      .order("created_at", { ascending: false })
      .limit(12),
    userId
      ? supabase.from("degul_score").select("score").eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = meetingResult.error || boardResult.error || scoreResult.error;
  if (error) return { data: null, error };

  const meetings = meetingResult.data || [];
  const boards = boardResult.data || [];
  let attendances = [];

  if (userId && meetings.length > 0) {
    const attendanceResult = await supabase
      .from("degul_attendance")
      .select("*")
      .eq("user_id", userId)
      .in("meeting_id", meetings.map((item) => item.meeting_id));

    if (attendanceResult.error) return { data: null, error: attendanceResult.error };
    attendances = attendanceResult.data || [];
  }

  const attendanceByMeeting = Object.fromEntries(
    attendances.map((item) => [item.meeting_id, item])
  );
  const scores = scoreResult.data || [];
  const gameCount = scores.length;
  const scoreValues = scores.map((item) => Number(item.score));

  return {
    data: {
      meetings,
      attendanceByMeeting,
      notices: boards.filter((item) => item.board_tp === "NOT").slice(0, 3),
      freeBoards: boards.filter((item) => item.board_tp === "FRI").slice(0, 3),
      stats: {
        avgScore: gameCount
          ? (scoreValues.reduce((sum, score) => sum + score, 0) / gameCount).toFixed(1)
          : "-",
        highScore: gameCount ? Math.max(...scoreValues) : "-",
        gameCnt: gameCount,
      },
    },
    error: null,
  };
}
