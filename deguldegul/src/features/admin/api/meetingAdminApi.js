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

export async function fetchMeetingParticipantAdminData(meetingId, canSeePhone = false) {
  const userColumns = canSeePhone
    ? "id, name, nickname, phone_no, car_no"
    : "id, name, nickname, car_no";
  const [userResult, attendanceResult, planResult, assignmentResult] =
    await Promise.all([
      supabase
        .from("degul_users")
        .select(userColumns)
        .eq("status", "ACT")
        .order("name"),
      supabase
        .from("degul_attendance")
        .select("meeting_id, user_id, attendance_tp, battle_join_yn")
        .eq("meeting_id", meetingId),
      supabase
        .from("degul_meeting_lane_plan")
        .select("meeting_id, lane_count, assignment_method, updated_at")
        .eq("meeting_id", meetingId)
        .maybeSingle(),
      supabase
        .from("degul_meeting_lane_assignment")
        .select(`
          assignment_id, meeting_id, user_id, table_no, lane_no, avg_score,
          user:user_id (id, name, nickname)
        `)
        .eq("meeting_id", meetingId)
        .order("lane_no"),
    ]);

  const initialError =
    userResult.error ||
    attendanceResult.error ||
    planResult.error ||
    assignmentResult.error;
  if (initialError) return { data: null, error: initialError };

  const activeAttendances = (attendanceResult.data || []).filter((item) =>
    ["ATD", "LAT"].includes(item.attendance_tp)
  );
  const attendeeIds = activeAttendances.map((item) => item.user_id);
  let scores = [];

  if (attendeeIds.length > 0) {
    const scoreResult = await supabase
      .from("degul_score")
      .select("user_id, score")
      .in("user_id", attendeeIds);
    if (scoreResult.error) return { data: null, error: scoreResult.error };
    scores = scoreResult.data || [];
  }

  const scoreMap = scores.reduce((map, item) => {
    const values = map.get(item.user_id) || [];
    values.push(Number(item.score));
    map.set(item.user_id, values);
    return map;
  }, new Map());
  const userMap = new Map((userResult.data || []).map((user) => [user.id, user]));

  const attendees = activeAttendances
    .map((attendance) => {
      const user = userMap.get(attendance.user_id);
      if (!user) return null;
      const values = (scoreMap.get(attendance.user_id) || []).filter(Number.isFinite);
      return {
        ...user,
        attendance_tp: attendance.attendance_tp,
        battle_join_yn: attendance.battle_join_yn,
        avg_score:
          values.length > 0
            ? values.reduce((sum, score) => sum + score, 0) / values.length
            : null,
      };
    })
    .filter(Boolean);

  return {
    data: {
      users: userResult.data || [],
      attendees,
      plan: planResult.data || null,
      assignments: assignmentResult.data || [],
    },
    error: null,
  };
}

export const addMeetingAttendee = (meetingId, userId) =>
  supabase.rpc("admin_set_meeting_attendee", {
    p_meeting_id: meetingId,
    p_user_id: userId,
    p_attending: true,
  });

export const removeMeetingAttendee = (meetingId, userId) =>
  supabase.rpc("admin_set_meeting_attendee", {
    p_meeting_id: meetingId,
    p_user_id: userId,
    p_attending: false,
  });

export const saveMeetingLaneAssignment = ({
  meetingId,
  laneCount,
  method,
  assignments,
}) =>
  supabase.rpc("admin_save_meeting_lane_assignment", {
    p_meeting_id: meetingId,
    p_lane_count: laneCount,
    p_assignment_method: method,
    p_assignments: assignments.map((item) => ({
      user_id: item.user_id,
      table_no: item.table_no,
      lane_no: item.lane_no,
      avg_score: item.avg_score,
    })),
  });
