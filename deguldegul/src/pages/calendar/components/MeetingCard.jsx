import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  formatTime,
  getAttendanceLabel,
  getMeetingTypeLabel,
  getStatusLabel,
} from "../utils/calendarUtils";

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

function MeetingCard({
  meeting,
  attendance,
  profile,
  onVoteClick,
  onBattleClick,
  onCloseFlashClick,
}) {
  const isFlashOwner =
    meeting.meeting_tp === "FLS" &&
    meeting.created_by === profile?.id &&
    meeting.status === "OPN";

  return (
    <Card sx={cardSx}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <div>
            <Typography fontWeight={800}>{meeting.meeting_nm}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {meeting.center?.center_nm || "-"}
            </Typography>
          </div>

          <Chip
            label={getStatusLabel(meeting.status)}
            color={meeting.status === "OPN" ? "primary" : "success"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Typography sx={{ mt: 1 }}>{formatTime(meeting.meeting_dt)}</Typography>

        <Typography variant="body2" color="text.secondary">
          {getMeetingTypeLabel(meeting.meeting_tp)}
        </Typography>

        {attendance && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              label={getAttendanceLabel(attendance.attendance_tp)}
              size="small"
              color={
                ["ATD", "LAT"].includes(attendance.attendance_tp)
                  ? "primary"
                  : "default"
              }
            />

            {attendance.battle_join_yn === "Y" && (
              <Chip label="배틀참가" size="small" color="warning" />
            )}
          </Stack>
        )}

        {meeting.meeting_tp === "REG" && meeting.center?.bank_nm && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {meeting.center.bank_nm} {meeting.center.account_no}{" "}
            {meeting.center.account_holder}
          </Typography>
        )}

        {meeting.memo && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {meeting.memo}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onVoteClick}
            disabled={meeting.status !== "OPN"}
          >
            {attendance ? "참석 정보 수정" : "참석 투표"}
          </Button>

          {isFlashOwner && (
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              onClick={onCloseFlashClick}
            >
              번개 마감/대진생성
            </Button>
          )}

          <Button fullWidth variant="outlined" onClick={onBattleClick}>
            대진표 보기
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default MeetingCard;