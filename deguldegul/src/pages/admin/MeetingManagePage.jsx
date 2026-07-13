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
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

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

  const [meetings, setMeetings] = useState([]);
  const [centers, setCenters] = useState([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredMeetings = useMemo(() => {
    if (!onlyOpen) return meetings;
    return meetings.filter((meeting) => meeting.status === "OPN");
  }, [meetings, onlyOpen]);

  const loadData = async () => {
    setMessage("");

    const { data: centerData, error: centerError } = await supabase
      .from("degul_center")
      .select("*")
      .eq("use_yn", "Y")
      .order("center_nm");

    if (centerError) {
      setMessage(centerError.message);
      return;
    }

    setCenters(centerData || []);

    const { data, error } = await supabase
      .from("degul_meeting")
      .select(`
        meeting_id,
        meeting_nm,
        meeting_tp,
        meeting_dt,
        max_member_cnt,
        memo,
        status,
        center:center_id (
          center_nm
        )
      `)
      .eq("use_yn", "Y")
      .order("meeting_dt", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMeetings(data || []);
  };

  const handleSave = async () => {
    if (!form.meeting_nm.trim() || !form.center_id || !form.meeting_dt) {
      alert("모임명, 볼링장, 일시는 필수입니다.");
      return;
    }

    const { error } = await supabase.from("degul_meeting").insert({
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

  const closeMeeting = async (meetingId) => {
    const ok = confirm(
      "모임을 마감하고 배틀로얄 대진표를 생성할까요?\n기존 대진표가 있으면 다시 생성됩니다."
    );

    if (!ok) return;

    const { error: updateError } = await supabase
      .from("degul_meeting")
      .update({
        status: "CLS",
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meetingId);

    if (updateError) {
      alert(updateError.message);
      return;
    }

    const { error: battleError } = await supabase.rpc(
      "generate_battle_matches",
      {
        p_meeting_id: meetingId,
      }
    );

    if (battleError) {
      alert(`대진표 생성 실패: ${battleError.message}`);
      return;
    }

    await loadData();
  };

  const updateMeetingStatus = async (meetingId, status) => {
    const { error } = await supabase
      .from("degul_meeting")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meetingId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  const reopenMeeting = async (meetingId) => {
    const ok = confirm("모임을 다시 모집중으로 전환할까요?");

    if (!ok) return;

    const { error } = await supabase
      .from("degul_meeting")
      .update({
        status: "OPN",
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meetingId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  };

  useEffect(() => {
    loadData();
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
                  label={getStatusLabel(meeting.status)}
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
                {meeting.status === "OPN" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => closeMeeting(meeting.meeting_id)}
                  >
                    마감/대진생성
                  </Button>
                )}

                {meeting.status === "CLS" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => reopenMeeting(meeting.meeting_id)}
                  >
                    모집중 전환
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
              <MenuItem value="REG">정기전</MenuItem>
              <MenuItem value="FLS">번개</MenuItem>
              <MenuItem value="EVT">이벤트</MenuItem>
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
    </Box>
  );
}

function getMeetingTypeLabel(value) {
  const map = {
    REG: "정기전",
    FLS: "번개",
    EVT: "이벤트",
  };

  return map[value] || value;
}

function getStatusLabel(value) {
  const map = {
    OPN: "모집중",
    CLS: "마감",
    CNL: "취소",
  };

  return map[value] || value;
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

export default MeetingManagePage;
