import { supabase } from "../../../services/supabase";

export const fetchActiveCenters = () =>
  supabase.from("degul_center").select("center_id, center_nm").eq("use_yn", "Y").order("center_nm");

export const fetchCalendarMeetings = (start, end) =>
  supabase
    .from("degul_meeting")
    .select(`
      meeting_id, meeting_nm, meeting_tp, meeting_dt, max_member_cnt, memo,
      status, created_by, attendance_closed_at, battle_generated_at,
      center:center_id (center_nm, address, bank_nm, account_no, account_holder, game_cost)
    `)
    .eq("use_yn", "Y")
    .neq("status", "CNL")
    .gte("meeting_dt", start)
    .lt("meeting_dt", end)
    .order("meeting_dt", { ascending: true })
    .order("status", { ascending: false });

export const fetchUserScores = (userId, meetingIds) =>
  supabase.from("degul_score").select("*").eq("user_id", userId).in("meeting_id", meetingIds).order("game_no");

export const fetchUserAttendances = (userId, meetingIds) =>
  supabase.from("degul_attendance").select("*").eq("user_id", userId).in("meeting_id", meetingIds);

export const fetchBattleEntries = (meetingIds) =>
  supabase
    .from("degul_attendance")
    .select(`meeting_id, user_id, battle_join_yn, user:user_id (id, name, nickname)`)
    .eq("battle_join_yn", "Y")
    .in("meeting_id", meetingIds);

export const saveAttendance = (payload) =>
  supabase.from("degul_attendance").upsert(payload, { onConflict: "meeting_id,user_id" });

export const updateMyBattleJoin = (meetingId, battleJoinYn) =>
  supabase.rpc("update_my_battle_join", {
    p_meeting_id: meetingId,
    p_battle_join_yn: battleJoinYn,
  });

export const createFlashMeeting = (payload) => supabase.from("degul_meeting").insert(payload);

export const closeMeetingAttendance = (meetingId) =>
  supabase.rpc("close_meeting_attendance", { p_meeting_id: meetingId });

export const finalizeBattleMatches = (meetingId) =>
  supabase.rpc("finalize_battle_matches", { p_meeting_id: meetingId });

export const completeMeeting = (meetingId) =>
  supabase.rpc("complete_meeting", { p_meeting_id: meetingId });

export const cancelOwnedFlashMeeting = (meetingId, userId) =>
  supabase
    .from("degul_meeting")
    .update({ use_yn: "N", status: "CNL", updated_at: new Date().toISOString() })
    .eq("meeting_id", meetingId)
    .eq("meeting_tp", "FLS")
    .eq("created_by", userId)
    .is("attendance_closed_at", null)
    .eq("status", "OPN");

export const deleteUserScores = (meetingId, userId) =>
  supabase.from("degul_score").delete().eq("meeting_id", meetingId).eq("user_id", userId);

export const insertScores = (scores) => supabase.from("degul_score").insert(scores);

export const fetchBattleMatches = (meetingId) =>
  supabase
    .from("degul_battle_history")
    .select(`
      battle_id, meeting_id, game_no, bye_yn, result_status, result_confirm_yn,
      winner_user_id, loser_user_id,
      user1:user1_id (id, name, nickname), user2:user2_id (id, name, nickname)
    `)
    .eq("meeting_id", meetingId)
    .order("game_no", { ascending: true });

export const fetchMeetingAttendances = (meetingId) =>
  supabase
    .from("degul_attendance")
    .select(`
      meeting_id, user_id, attendance_tp, battle_join_yn, memo, updated_at,
      user:user_id (id, name, nickname)
    `)
    .eq("meeting_id", meetingId)
    .order("attendance_tp", { ascending: true })
    .order("updated_at", { ascending: true });
