import { supabase } from "../../../services/supabase";

export const fetchCapsuleDashboard = (roundId = null) =>
  supabase.rpc("get_capsule_dashboard", {
    p_round_id: roundId,
  });

export const drawCapsule = (roundId) =>
  supabase.rpc("draw_capsule", {
    p_round_id: roundId,
  });

export const fetchMyCapsuleHistory = (roundId = null) =>
  supabase.rpc("get_my_capsule_history", {
    p_round_id: roundId,
  });

export const fetchAdminCapsuleRounds = () =>
  supabase.rpc("admin_get_capsule_rounds");

export const fetchAdminCapsuleHistory = (roundId) =>
  supabase.rpc("admin_get_capsule_history", {
    p_round_id: roundId,
  });

export const updateCapsulePrizePaid = ({ capsuleId, paid }) =>
  supabase.rpc("admin_update_capsule_prize_paid", {
    p_capsule_id: capsuleId,
    p_paid_yn: paid ? "Y" : "N",
  });

export const createCapsuleRound = ({
  roundYear,
  roundNo,
  roundName,
  startDate,
  endDate,
  memo,
  prizes,
}) =>
  supabase.rpc("admin_create_capsule_round", {
    p_round_year: roundYear,
    p_round_no: roundNo,
    p_round_nm: roundName,
    p_start_dt: startDate,
    p_end_dt: endDate,
    p_memo: memo || null,
    p_prizes: prizes,
  });

export const startCapsuleRound = (roundId) =>
  supabase.rpc("admin_start_capsule_round", {
    p_round_id: roundId,
  });

export const grantCapsuleCoin = ({ userId, roundId, coinQty, memo }) =>
  supabase.rpc("admin_grant_capsule_coin", {
    p_user_id: userId,
    p_round_id: roundId,
    p_coin_qty: coinQty,
    p_memo: memo || null,
  });

export const grantAttendanceCapsuleCoins = ({ roundId, meetingId }) =>
  supabase.rpc("admin_grant_attendance_capsule_coins", {
    p_round_id: roundId,
    p_meeting_id: meetingId,
  });
