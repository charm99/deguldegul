import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { useCommonCodes } from "../../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../../shared/constants/commonCodeGroups";

const BLUE = "#0868f7";

function MeetingCard({
  meeting,
  attendance,
  scores = [],
  profile,
  onScoreClick,
  onVoteClick,
  onBattleClick,
  onCloseFlashClick,
  onGenerateBattleClick,
  onCompleteMeetingClick,
  onDeleteFlashClick,
  onAttendanceListClick,
}) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { getCodeName } = useCommonCodes();

  const isFlashOwner =
    meeting.meeting_tp === "FLS" &&
    meeting.created_by === profile?.id &&
    meeting.status === "OPN";
  const canEditVote =
    meeting.status === "OPN" &&
    !meeting.battle_generated_at &&
    (!meeting.attendance_closed_at ||
      ["ATD", "LAT"].includes(attendance?.attendance_tp));
  const canEnterScore =
    attendance && ["ATD", "LAT"].includes(attendance.attendance_tp);
  const hasScores = scores.length > 0;
  const accountText = [
    meeting.center?.bank_nm,
    meeting.center?.account_no,
  ]
    .filter(Boolean)
    .join(" ");
  const accountDisplayText = [
    accountText,
    meeting.center?.account_holder,
  ]
    .filter(Boolean)
    .join(" ");

  const copyAccount = async () => {
    if (!accountText) return;
    try {
      await navigator.clipboard.writeText(accountText);
      setSnackbarOpen(true);
    } catch {
      alert(accountText);
    }
  };

  return (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          bgcolor: "#fff",
          borderBottom: "8px solid #f7f7f8",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            color="#16181c"
            fontWeight={800}
            sx={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: 1.4 }}
          >
            {formatMeetingTitle(meeting)}
          </Typography>
          {isFlashOwner && (
            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
              {!meeting.attendance_closed_at && (
                <Button size="small" color="warning" onClick={onCloseFlashClick} sx={{ minWidth: 36, px: 0.5, fontSize: 11 }}>
                  참석마감
                </Button>
              )}
              {meeting.attendance_closed_at && !meeting.battle_generated_at && (
                <Button size="small" color="warning" onClick={onGenerateBattleClick} sx={{ minWidth: 36, px: 0.5, fontSize: 11 }}>
                  대진생성
                </Button>
              )}
              {meeting.attendance_closed_at && (
                <Button size="small" onClick={onCompleteMeetingClick} sx={{ minWidth: 36, px: 0.5, fontSize: 11 }}>
                  완료
                </Button>
              )}
              {!meeting.attendance_closed_at && (
                <Button size="small" color="error" onClick={onDeleteFlashClick} sx={{ minWidth: 36, px: 0.5, fontSize: 11 }}>
                  삭제
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        <Stack spacing={0.3} sx={{ mt: 1.1 }}>
          <InfoRow
            label="장 소"
            value={meeting.center?.center_nm || "-"}
            trailing={
              meeting.center?.address ? (
                <Button
                  size="small"
                  onClick={() => setShowAddress((previous) => !previous)}
                  sx={{
                    minWidth: 44,
                    p: 0,
                    color: "#777c84",
                    fontSize: 11,
                    lineHeight: 1.4,
                  }}
                >
                  {showAddress ? "접기" : "상세보기"}
                </Button>
              ) : null
            }
          />
          {showAddress && (
            <Typography
              color="#666b73"
              sx={{
                pl: "58px",
                py: 0.35,
                fontSize: 12,
                lineHeight: 1.45,
                wordBreak: "keep-all",
              }}
            >
              {meeting.center.address}
            </Typography>
          )}
          <InfoRow label="시 간" value={formatTime(meeting.meeting_dt)} />
          <InfoRow
            label="게임비"
            value={`${formatCost(meeting.center?.game_cost, meeting.meeting_tp)} (${meeting.meeting_tp === "REG" ? 4 : 1}게임)`}
            inlineAction={
              accountText ? (
                <Button
                  size="small"
                  onClick={() => setShowAccount((previous) => !previous)}
                  sx={{
                    minWidth: 44,
                    p: 0,
                    color: "#777c84",
                    fontSize: 11,
                    lineHeight: 1.4,
                  }}
                >
                  {showAccount ? "숨기기" : "계좌보기"}
                </Button>
              ) : null
            }
          />
          {showAccount && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
              sx={{ pl: "58px", py: 0.35 }}
            >
              <Typography
                color="#30333a"
                fontWeight={500}
                sx={{ flex: 1, minWidth: 0, fontSize: 12, lineHeight: 1.45 }}
              >
                {accountDisplayText}
              </Typography>
              <Button
                size="small"
                onClick={copyAccount}
                sx={{
                  minWidth: 48,
                  p: 0,
                  color: "#777c84",
                  fontSize: 11,
                  lineHeight: 1.4,
                }}
              >
                계좌복사
              </Button>
            </Stack>
          )}
          <Stack direction="row" spacing={0.5} sx={{ pt: 0.2 }}>
            <Chip
              label={getCodeName(COMMON_CODE_GROUP.MEETING_TYPE, meeting.meeting_tp)}
              size="small"
              sx={chipSx("#eaf3ff", BLUE)}
            />
            <Chip
              label={getCodeName(COMMON_CODE_GROUP.MEETING_STATUS, meeting.status)}
              size="small"
              sx={chipSx(meeting.status === "OPN" ? "#f1edff" : "#eeeeef", meeting.status === "OPN" ? "#7657dc" : "#666a70")}
            />
            {meeting.attendance_closed_at && meeting.status === "OPN" && (
              <Chip label={meeting.battle_generated_at ? "대진확정" : "참석마감"} size="small" sx={chipSx("#fff1df", "#dc7900")} />
            )}
            {attendance && (
              <Chip
                label={getCodeName(
                  COMMON_CODE_GROUP.ATTENDANCE_STATUS,
                  attendance.attendance_tp
                )}
                size="small"
                sx={attendanceChipSx(attendance.attendance_tp)}
              />
            )}
            {attendance?.battle_join_yn === "Y" && (
              <Chip
                label="배틀참가"
                size="small"
                sx={chipSx("#fff1df", "#dc7900")}
              />
            )}
          </Stack>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          onClick={onScoreClick}
          disabled={!canEnterScore}
          sx={{
            mt: 1,
            height: 42,
            borderRadius: 1.5,
            bgcolor: BLUE,
            boxShadow: "none",
            fontSize: 13,
            fontWeight: 800,
            "&:hover": { bgcolor: "#0059dd", boxShadow: "none" },
            "&.Mui-disabled": { bgcolor: "#f0f0f1", color: "#aaaeb4" },
          }}
        >
          {canEnterScore
            ? hasScores
              ? "점수수정"
              : "점수입력"
            : "참석 후 점수입력 가능"}
        </Button>

        {meeting.memo && (
          <Typography
            color="#555a62"
            sx={{ mt: 1, px: 0.2, fontSize: 12, lineHeight: 1.45 }}
          >
            {meeting.memo}
          </Typography>
        )}

        <Stack direction="row" spacing={0.8} sx={{ mt: 1.1 }}>
          <ActionButton onClick={onAttendanceListClick}>참석자</ActionButton>
          <ActionButton onClick={onBattleClick}>대진표</ActionButton>
          <ActionButton
            primary
            onClick={onVoteClick}
            disabled={!canEditVote}
          >
            {meeting.attendance_closed_at ? "배틀참가 수정" : attendance ? "참석수정" : "참석투표"}
          </ActionButton>
        </Stack>

      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={1800}
        onClose={() => setSnackbarOpen(false)}
        message="계좌정보가 복사되었습니다."
      />
    </>
  );
}

function InfoRow({ label, value, inlineAction, trailing }) {
  return (
    <Stack direction="row" alignItems="center" minHeight={18}>
      <Typography
        color="#a0a4ab"
        sx={{
          width: 58,
          flexShrink: 0,
          whiteSpace: "nowrap",
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        color="#30333a"
        fontWeight={500}
        noWrap
        sx={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4 }}
      >
        {value}
      </Typography>
      {inlineAction}
      {trailing}
    </Stack>
  );
}

function ActionButton({ primary = false, children, ...props }) {
  return (
    <Button
      fullWidth
      variant={primary ? "contained" : "text"}
      {...props}
      sx={{
        minWidth: 0,
        height: 39,
        borderRadius: 1.2,
        boxShadow: "none",
        bgcolor: primary ? BLUE : "#eaf3ff",
        color: primary ? "#fff" : BLUE,
        fontSize: 13,
        fontWeight: 700,
        "&:hover": { bgcolor: primary ? "#0059dd" : "#dcecff" },
        "&.Mui-disabled": { bgcolor: "#f0f0f1", color: "#aaaeb4" },
      }}
    >
      {children}
    </Button>
  );
}

function chipSx(backgroundColor, color) {
  return {
    height: 22,
    bgcolor: backgroundColor,
    color,
    fontSize: 10.5,
    fontWeight: 700,
    "& .MuiChip-label": { px: 0.8 },
  };
}

function attendanceChipSx(type) {
  if (["ATD", "LAT"].includes(type)) {
    return chipSx("#eaf3ff", BLUE);
  }
  if (type === "ABS") {
    return chipSx("#eeeeef", "#555a62");
  }
  return chipSx("#f2f0ff", "#7255d8");
}

function formatMeetingTitle(meeting) {
  const date = new Date(meeting.meeting_dt);
  const dateLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  return meeting.meeting_nm?.startsWith(`${date.getFullYear()}년`)
    ? meeting.meeting_nm
    : `${dateLabel} ${meeting.meeting_nm}`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCost(cost, meetingType) {
  const amount = Number(cost || 0) * (meetingType === "REG" ? 4 : 1);
  return amount ? `${amount.toLocaleString()}원` : "-";
}

export default MeetingCard;
