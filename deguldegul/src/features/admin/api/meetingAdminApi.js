import { supabase } from "../../../services/supabase";

export async function fetchMeetingAdminData() {
  const [centerResult, meetingResult] = await Promise.all([
    supabase.from("degul_center").select("*").eq("use_yn", "Y").order("center_nm"),
    supabase
      .from("degul_meeting")
      .select(`
        meeting_id, meeting_nm, meeting_tp, meeting_dt, max_member_cnt,
        memo, status, center:center_id (center_nm)
      `)
      .eq("use_yn", "Y")
      .order("meeting_dt", { ascending: true }),
  ]);

  const error = centerResult.error || meetingResult.error;
  return {
    data: error ? null : { centers: centerResult.data || [], meetings: meetingResult.data || [] },
    error,
  };
}

export const createMeeting = (payload) => supabase.from("degul_meeting").insert(payload);

export function updateMeetingStatus(meetingId, status) {
  return supabase
    .from("degul_meeting")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("meeting_id", meetingId);
}

export const generateBattleMatches = (meetingId) =>
  supabase.rpc("generate_battle_matches", { p_meeting_id: meetingId });
