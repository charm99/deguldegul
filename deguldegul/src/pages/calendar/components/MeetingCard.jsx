import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";

import { useState } from "react";

import {
  formatTime,
  getAttendanceLabel,
  getMeetingTypeLabel,
  getStatusLabel,
} from "../utils/calendarUtils";

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
};

function MeetingCard({
  meeting,
  attendance,
  profile,
  onVoteClick,
  onBattleClick,
  onCloseFlashClick,
  onDeleteFlashClick,
}) {
  const [showAddress, setShowAddress] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const isFlashOwner =
    meeting.meeting_tp === "FLS" &&
    meeting.created_by === profile?.id &&
    meeting.status === "OPN";

  const canDeleteFlash = isFlashOwner;

  const displayAccountText = [
    meeting.center?.bank_nm,
    meeting.center?.account_no,
    meeting.center?.account_holder,
  ]
    .filter(Boolean)
    .join(" ");

  const copyAccountText = [
    meeting.center?.bank_nm,
    meeting.center?.account_no,
  ]
    .filter(Boolean)
    .join(" ");

  const copyAccount = async () => {
    if (!copyAccountText) return;

    try {
      await navigator.clipboard.writeText(copyAccountText);
      setSnackbarOpen(true);
    } catch {
      alert(copyAccountText);
    }
  };

  return (
    <>
      <Card sx={cardSx}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={900} fontSize={16} lineHeight={1.35}>
                {meeting.meeting_nm}
              </Typography>

              <Stack
                direction="row"
                spacing={0.7}
                alignItems="center"
                onClick={() => setShowAddress((prev) => !prev)}
                sx={{ mt: 1, cursor: "pointer", width: "fit-content" }}
              >
                <PlaceOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {meeting.center?.center_nm || "-"}
                </Typography>
              </Stack>

              {showAddress && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.7, pl: "25px", whiteSpace: "pre-wrap" }}
                >
                  {meeting.center?.address || "등록된 주소가 없습니다."}
                </Typography>
              )}
            </Box>

            <Chip
              label={getStatusLabel(meeting.status)}
              color={meeting.status === "OPN" ? "primary" : "success"}
              size="small"
              sx={{ fontWeight: 800, borderRadius: 2 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography fontWeight={800}>{formatTime(meeting.meeting_dt)}</Typography>

            <Chip
              label={getMeetingTypeLabel(meeting.meeting_tp)}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          {meeting.center?.game_cost > 0 && (
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1 }}>
              <PaidOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                게임비 {Number(meeting.center.game_cost).toLocaleString()}원
              </Typography>
            </Stack>
          )}

          {attendance && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Chip
                label={getAttendanceLabel(attendance.attendance_tp)}
                size="small"
                color={
                  ["ATD", "LAT"].includes(attendance.attendance_tp)
                    ? "primary"
                    : "default"
                }
                sx={{ fontWeight: 800 }}
              />

              {attendance.battle_join_yn === "Y" && (
                <Chip
                  label="배틀참가"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 800 }}
                />
              )}
            </Stack>
          )}

          {meeting.meeting_tp === "REG" && displayAccountText && (
            <Box
              onClick={copyAccount}
              sx={{
                mt: 1.5,
                p: 1.2,
                borderRadius: 2,
                bgcolor: "#f5f6fa",
                cursor: "pointer",
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <AccountBalanceIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {displayAccountText}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    터치하면 은행/계좌번호가 복사됩니다.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {meeting.memo && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1.2, whiteSpace: "pre-wrap" }}
            >
              {meeting.memo}
            </Typography>
          )}

          <Divider sx={{ my: 1.7 }} />

          <Stack spacing={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={onVoteClick}
              disabled={meeting.status !== "OPN"}
              sx={{ fontWeight: 900, borderRadius: 2, py: 1 }}
            >
              {attendance ? "참석 정보 수정" : "참석 투표"}
            </Button>

            {isFlashOwner && (
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                onClick={onCloseFlashClick}
                sx={{ fontWeight: 900, borderRadius: 2, py: 1 }}
              >
                번개 마감/대진생성
              </Button>
            )}

            <Button
              fullWidth
              variant="outlined"
              onClick={onBattleClick}
              sx={{ fontWeight: 900, borderRadius: 2, py: 1 }}
            >
              대진표 보기
            </Button>

            {canDeleteFlash && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={onDeleteFlashClick}
                sx={{ fontWeight: 900, borderRadius: 2, py: 1 }}
              >
                번개 삭제
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1800}
        onClose={() => setSnackbarOpen(false)}
        message="은행/계좌번호가 복사되었습니다."
      />
    </>
  );
}

export default MeetingCard;