import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  createMeeting,
  closeMeetingAttendance,
  completeMeeting,
  fetchMeetingAdminData,
  finalizeBattleMatches,
  reopenMeetingAttendance,
  updateMeetingStatus as updateMeetingStatusRequest,
} from "../../features/admin/api/meetingAdminApi";
import { koreanDateTimeLocalToUtcIso } from "../../shared/utils/date";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";
import MeetingParticipantDialog from "./components/MeetingParticipantDialog";
import { canSeePrivateUserInfo } from "../../shared/model/permissions";

const EMPTY_FORM = {
  meeting_nm: "",
  meeting_tp: "REG",
  center_id: "",
  meeting_dt: "",
  max_member_cnt: "",
  memo: "",
};

function MeetingManagePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getCodes, getCodeName } = useCommonCodes();
  const meetingTypes = getCodes(COMMON_CODE_GROUP.MEETING_TYPE);
  const getMeetingTypeLabel = (value) =>
    getCodeName(COMMON_CODE_GROUP.MEETING_TYPE, value);
  const getStatusLabel = (value) =>
    getCodeName(COMMON_CODE_GROUP.MEETING_STATUS, value);

  const [meetings, setMeetings] = useState([]);
  const [centers, setCenters] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [participantMeeting, setParticipantMeeting] = useState(null);

  const filteredMeetings = useMemo(() => {
    if (!onlyOpen) return meetings;
    return meetings.filter((meeting) => meeting.status === "OPN");
  }, [meetings, onlyOpen]);

  const loadData = async () => {
    setMessage("");

    const { data, error } = await fetchMeetingAdminData();

    if (error) {
      setMessage(error.message);
      return;
    }

    setCenters(data.centers);
    setMeetings(data.meetings);
  };

  const handleSave = async () => {
    if (!form.meeting_nm.trim() || !form.center_id || !form.meeting_dt) {
      alert("모임명, 볼링장, 일시는 필수입니다.");
      return;
    }

    const { error } = await createMeeting({
      meeting_nm: form.meeting_nm.trim(),
      meeting_tp: form.meeting_tp,
      center_id: form.center_id,
      meeting_dt: koreanDateTimeLocalToUtcIso(form.meeting_dt),
      max_member_cnt: form.max_member_cnt ? Number(form.max_member_cnt) : null,
      memo: form.memo.trim(),
      status: "OPN",
      created_by: profile.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setOpen(false);
    setForm(EMPTY_FORM);
    await loadData();
  };

  const closeAttendance = async (meetingId) => {
    const ok = confirm("예약 인원 확정을 위해 참석자를 마감할까요?\n마감 후에도 배틀 참가 여부는 변경할 수 있습니다.");

    if (!ok) return;

    const { error } = await closeMeetingAttendance(meetingId);
    if (error) {
      alert(error.message);
      return;
    }
    await loadData();
  };

  const generateBattle = async (meetingId) => {
    if (!confirm("현재 배틀 참가자로 대진표를 확정할까요?\n생성 후에는 배틀 참가 여부를 변경할 수 없습니다.")) return;

    const { error } = await finalizeBattleMatches(meetingId);
    if (error) {
      alert(`대진표 생성 실패: ${error.message}`);
      return;
    }
    await loadData();
  };

  const finishMeeting = async (meetingId) => {
    if (!confirm("모임을 완료 처리할까요?")) return;
    const { error } = await completeMeeting(meetingId);
    if (error) {
      alert(error.message);
      return;
    }
    await loadData();
  };

  const updateMeetingStatus = async (meetingId, status) => {
    const { error } = await updateMeetingStatusRequest(meetingId, status);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  const reopenAttendance = async (meetingId) => {
    const ok = confirm("참석자 마감을 취소하고 다시 신청받을까요?");

    if (!ok) return;

    const { error } = await reopenMeetingAttendance(meetingId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  useEffect(() => {
    let active = true;

    fetchMeetingAdminData().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("");
      setCenters(data.centers);
      setMeetings(data.meetings);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton onClick={() => navigate("/admin")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
          모임관리
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          등록
        </Button>
      </Stack>

      <FormControlLabel
        sx={{ mb: 1 }}
        control={
          <Switch
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
        }
        label={onlyOpen ? "모집중만 보기" : "전체 모임 보기"}
      />

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {!message && filteredMeetings.length === 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              표시할 모임이 없습니다.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.meeting_id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography fontWeight={800}>
                    {meeting.meeting_nm}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {meeting.center?.center_nm || "-"}
                  </Typography>
                </Box>

                <Chip
                  label={getMeetingPhaseLabel(meeting, getStatusLabel)}
                  color={meeting.status === "OPN" ? "primary" : "default"}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Typography sx={{ mt: 1 }}>
                {formatDateTime(meeting.meeting_dt)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                구분: {getMeetingTypeLabel(meeting.meeting_tp)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                최대인원: {meeting.max_member_cnt || "제한없음"}
              </Typography>

              {meeting.memo && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {meeting.memo}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {meeting.status !== "CNL" && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setParticipantMeeting(meeting)}
                    sx={{ fontWeight: 800 }}
                  >
                    참석자/레인
                  </Button>
                )}

                {meeting.status === "OPN" && !meeting.attendance_closed_at && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => closeAttendance(meeting.meeting_id)}
                  >
                    참석자 마감
                  </Button>
                )}

                {meeting.status === "OPN" && meeting.attendance_closed_at && !meeting.battle_generated_at && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => generateBattle(meeting.meeting_id)}
                  >
                    배틀 마감/대진 생성
                  </Button>
                )}

                {meeting.status === "OPN" && meeting.attendance_closed_at && !meeting.battle_generated_at && (
                  <Button size="small" onClick={() => reopenAttendance(meeting.meeting_id)}>
                    참석 다시 열기
                  </Button>
                )}

                {meeting.status === "OPN" && meeting.attendance_closed_at && (
                  <Button fullWidth variant="outlined" onClick={() => finishMeeting(meeting.meeting_id)}>
                    모임 완료
                  </Button>
                )}

                {meeting.status !== "CNL" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => updateMeetingStatus(meeting.meeting_id, "CNL")}
                  >
                    취소
                  </Button>
                )}

                {meeting.status === "CNL" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => updateMeetingStatus(meeting.meeting_id, "OPN")}
                  >
                    복구
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>모임 등록</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="모임명"
              value={form.meeting_nm}
              onChange={(e) =>
                setForm({ ...form, meeting_nm: e.target.value })
              }
              fullWidth
            />

            <TextField
              select
              label="모임구분"
              value={form.meeting_tp}
              onChange={(e) =>
                setForm({ ...form, meeting_tp: e.target.value })
              }
              fullWidth
            >
              {meetingTypes.map((item) => (
                <MenuItem key={item.com_cd} value={item.com_cd}>
                  {item.com_nm}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="볼링장"
              value={form.center_id}
              onChange={(e) =>
                setForm({ ...form, center_id: e.target.value })
              }
              fullWidth
            >
              {centers.map((center) => (
                <MenuItem key={center.center_id} value={center.center_id}>
                  {center.center_nm}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="모임일시"
              type="datetime-local"
              value={form.meeting_dt}
              onChange={(e) =>
                setForm({ ...form, meeting_dt: e.target.value })
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              fullWidth
            />

            <TextField
              label="최대인원"
              type="number"
              value={form.max_member_cnt}
              onChange={(e) =>
                setForm({ ...form, max_member_cnt: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="메모"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}>
            저장
          </Button>
        </DialogActions>
      </Dialog>

      <MeetingParticipantDialog
        meeting={participantMeeting}
        open={Boolean(participantMeeting)}
        canSeePhone={canSeePrivateUserInfo(profile)}
        onClose={() => setParticipantMeeting(null)}
      />
    </Box>
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMeetingPhaseLabel(meeting, getStatusLabel) {
  if (meeting.status !== "OPN") return getStatusLabel(meeting.status);
  if (meeting.battle_generated_at) return "대진 생성 완료";
  if (meeting.attendance_closed_at) return "참석 마감";
  return getStatusLabel(meeting.status);
}

export default MeetingManagePage;
