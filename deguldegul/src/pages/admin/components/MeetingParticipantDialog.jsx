import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {
  addMeetingAttendee,
  fetchMeetingParticipantAdminData,
  removeMeetingAttendee,
  saveMeetingLaneAssignment,
} from "../../../features/admin/api/meetingAdminApi";
import { createLaneAssignment } from "../../../features/admin/model/laneAssignment";

function MeetingParticipantDialog({ meeting, open, canSeePhone, onClose }) {
  const [users, setUsers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [laneCount, setLaneCount] = useState(4);
  const [method, setMethod] = useState("SCR");
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const availableUsers = useMemo(() => {
    const attendeeIds = new Set(attendees.map((item) => item.id));
    return users.filter((user) => !attendeeIds.has(user.id));
  }, [attendees, users]);

  const tables = useMemo(() => {
    const grouped = new Map();
    assignments.forEach((assignment) => {
      const tableNo = Number(assignment.table_no);
      if (!grouped.has(tableNo)) grouped.set(tableNo, []);
      grouped.get(tableNo).push(assignment);
    });
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [assignments]);

  const loadData = async () => {
    if (!meeting?.meeting_id) return;
    setBusy(true);
    const { data, error } = await fetchMeetingParticipantAdminData(
      meeting.meeting_id,
      canSeePhone
    );
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("");
    setUsers(data.users);
    setAttendees(data.attendees);
    setLaneCount(data.plan?.lane_count || 4);
    setMethod(data.plan?.assignment_method || "SCR");
    setAssignments(
      (data.assignments || []).map((item) => ({
        ...item,
        user: item.user || data.attendees.find((user) => user.id === item.user_id),
      }))
    );
  };

  useEffect(() => {
    if (!open || !meeting?.meeting_id) return undefined;
    let active = true;

    fetchMeetingParticipantAdminData(meeting.meeting_id, canSeePhone).then(({ data, error }) => {
      if (!active) return;
      setBusy(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("");
      setUsers(data.users);
      setAttendees(data.attendees);
      setLaneCount(data.plan?.lane_count || 4);
      setMethod(data.plan?.assignment_method || "SCR");
      setAssignments(
        (data.assignments || []).map((item) => ({
          ...item,
          user: item.user || data.attendees.find((user) => user.id === item.user_id),
        }))
      );
    });

    return () => {
      active = false;
    };
  }, [canSeePhone, meeting?.meeting_id, open]);

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setBusy(true);
    const { error } = await addMeetingAttendee(meeting.meeting_id, selectedUserId);
    setBusy(false);
    if (error) return setMessage(error.message);
    setSelectedUserId("");
    await loadData();
    setAssignments([]);
  };

  const handleRemove = async (attendee) => {
    if (!confirm(`${getUserName(attendee)}님을 참석자에서 제외할까요?`)) return;
    setBusy(true);
    const { error } = await removeMeetingAttendee(meeting.meeting_id, attendee.id);
    setBusy(false);
    if (error) return setMessage(error.message);
    await loadData();
    setAssignments([]);
  };

  const handleGenerate = () => {
    try {
      setAssignments(createLaneAssignment(attendees, Number(laneCount), method));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSave = async () => {
    if (assignments.length !== attendees.length) {
      setMessage("현재 참석자 기준으로 레인 편성을 먼저 생성해주세요.");
      return;
    }

    setBusy(true);
    const { error } = await saveMeetingLaneAssignment({
      meetingId: meeting.meeting_id,
      laneCount: Number(laneCount),
      method,
      assignments,
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    alert("레인 편성을 저장했습니다.");
    await loadData();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>참석자·레인 편성</Typography>
        <Typography noWrap color="#858991" sx={{ mt: 0.25, fontSize: 11.5 }}>
          {meeting?.meeting_nm}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f7f7f8", p: 2 }}>
        {message && <Alert severity="error" sx={{ mb: 1.25 }}>{message}</Alert>}

        <Section title={`참석자 ${attendees.length}명`}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }}>
            <TextField
              select
              size="small"
              label="회원 선택"
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              fullWidth
            >
              {availableUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {getUserName(user)}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              disabled={!selectedUserId || busy}
              onClick={handleAdd}
              sx={{ minWidth: 58, bgcolor: "#0868f7", fontWeight: 800 }}
            >
              추가
            </Button>
          </Stack>

          {attendees.map((attendee, index) => (
            <Box key={attendee.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.85 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                      {getUserName(attendee)}
                    </Typography>
                    <Chip
                      size="small"
                      label={attendee.avg_score ? `${attendee.avg_score.toFixed(1)}점` : "점수 없음"}
                      sx={{ height: 20, fontSize: 9.5 }}
                    />
                  </Stack>
                  <Typography color="#737780" sx={{ mt: 0.25, fontSize: 11 }}>
                    {canSeePhone && (
                      <>{attendee.phone_no || "전화번호 없음"} · </>
                    )}
                    {attendee.car_no || "차량번호 없음"}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  disabled={busy}
                  onClick={() => handleRemove(attendee)}
                >
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
              {index < attendees.length - 1 && <Divider />}
            </Box>
          ))}
        </Section>

        <Section title="레인 편성">
          <Stack direction="row" spacing={0.75}>
            <TextField
              select
              size="small"
              label="레인 수"
              value={laneCount}
              onChange={(event) => {
                setLaneCount(Number(event.target.value));
                setAssignments([]);
              }}
              sx={{ flex: 1 }}
            >
              {[2, 4, 6, 8, 10, 12].map((count) => (
                <MenuItem key={count} value={count}>{count}개</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="편성 기준"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value);
                setAssignments([]);
              }}
              sx={{ flex: 1.4 }}
            >
              <MenuItem value="SCR">점수·속도 균형</MenuItem>
              <MenuItem value="RND">랜덤</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              disabled={attendees.length === 0 || busy}
              onClick={handleGenerate}
              sx={{ minWidth: 64, fontWeight: 800 }}
            >
              편성
            </Button>
          </Stack>

          <Stack spacing={1} sx={{ mt: 1.25 }}>
            {tables.map(([tableNo, members]) => (
              <LaneTable key={tableNo} tableNo={tableNo} members={members} />
            ))}
            {assignments.length === 0 && (
              <Typography color="#858991" textAlign="center" sx={{ py: 2, fontSize: 12 }}>
                참석자를 확인한 후 레인 편성을 생성해주세요.
              </Typography>
            )}
          </Stack>
        </Section>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={onClose}>닫기</Button>
        <Button
          variant="contained"
          disabled={assignments.length === 0 || busy}
          onClick={handleSave}
          sx={{ bgcolor: "#0868f7", fontWeight: 900 }}
        >
          편성 저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 1.25, p: 1.5, bgcolor: "#fff", border: "1px solid #eceef2", borderRadius: 2 }}>
      <Typography sx={{ mb: 1.1, fontSize: 14, fontWeight: 900 }}>{title}</Typography>
      {children}
    </Box>
  );
}

function LaneTable({ tableNo, members }) {
  const lanes = [...new Set(members.map((item) => item.lane_no))].sort((a, b) => a - b);
  const tableAverage = average(members.map((item) => Number(item.avg_score)));

  return (
    <Box sx={{ overflow: "hidden", border: "1px solid #e4e8ee", borderRadius: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.25, py: 0.8, bgcolor: "#eef5ff" }}>
        <Typography color="#0868f7" sx={{ fontSize: 12, fontWeight: 900 }}>
          {tableNo}번 테이블 · {members.length}명
        </Typography>
        <Typography color="#5f6368" sx={{ fontSize: 11 }}>
          평균 {tableAverage.toFixed(1)}점
        </Typography>
      </Stack>
      {lanes.map((laneNo, index) => {
        const laneMembers = members.filter((item) => item.lane_no === laneNo);
        return (
          <Box key={laneNo}>
            <Stack direction="row" spacing={1} sx={{ px: 1.25, py: 0.9 }}>
              <Typography sx={{ width: 38, flexShrink: 0, fontSize: 11.5, fontWeight: 900 }}>
                {laneNo}레인
              </Typography>
              <Typography color="#5f6368" sx={{ flex: 1, fontSize: 11.5 }}>
                {laneMembers.map((item) => getUserName(item.user)).join(" · ")}
              </Typography>
            </Stack>
            {index < lanes.length - 1 && <Divider />}
          </Box>
        );
      })}
    </Box>
  );
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : 0;
}

function getUserName(user) {
  return user?.nickname || user?.name || "-";
}

export default MeetingParticipantDialog;
