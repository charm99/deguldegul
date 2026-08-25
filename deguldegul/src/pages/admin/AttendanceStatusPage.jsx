import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchMonthlyAttendanceStatus } from "../../features/admin/api/adminApi";
import { formatDateTime } from "../../shared/utils/date";

const MINIMUM_POINT = 6;

function currentKoreanMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function monthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    startDate: new Date(Date.UTC(year, monthNumber - 1, 1, -9)).toISOString(),
    endDate: new Date(Date.UTC(year, monthNumber, 1, -9)).toISOString(),
  };
}

function meetingPoint(meetingType) {
  if (meetingType === "REG") return 3;
  if (meetingType === "FLS") return 2;
  return 0;
}

function AttendanceStatusPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentKoreanMonth);
  const [view, setView] = useState("shortfall");
  const [data, setData] = useState({ users: [], attendances: [] });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const { startDate, endDate } = monthRange(month);

    fetchMonthlyAttendanceStatus(startDate, endDate).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error.message || "출석 현황을 불러오지 못했습니다.");
      } else {
        setData(result.data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [month]);

  const rows = useMemo(() => {
    const meetingsByUser = data.attendances.reduce((map, attendance) => {
      const list = map.get(attendance.user_id) || [];
      list.push({
        ...attendance.meeting,
        attendance_tp: attendance.attendance_tp,
        point: meetingPoint(attendance.meeting?.meeting_tp),
      });
      map.set(attendance.user_id, list);
      return map;
    }, new Map());

    return data.users.map((user) => {
      const meetings = (meetingsByUser.get(user.id) || []).sort(
        (a, b) => new Date(a.meeting_dt) - new Date(b.meeting_dt)
      );
      const point = meetings.reduce((sum, meeting) => sum + meeting.point, 0);
      return { ...user, meetings, point, isShortfall: point < MINIMUM_POINT };
    });
  }, [data]);

  const shortfallCount = rows.filter((row) => row.isShortfall).length;
  const visibleRows = view === "shortfall" ? rows.filter((row) => row.isShortfall) : rows;

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin")} aria-label="관리자 메뉴로 돌아가기">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={800}>출석 현황관리</Typography>
          <Typography variant="caption" color="text.secondary">월 6점 미만은 출석 미달입니다.</Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <TextField
              type="month"
              label="조회 월"
              size="small"
              value={month}
              onChange={(event) => {
                if (!event.target.value) return;
                setLoading(true);
                setError("");
                setMonth(event.target.value);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={view}
              onChange={(_, value) => value && setView(value)}
            >
              <ToggleButton value="shortfall">미달자만</ToggleButton>
              <ToggleButton value="all">전체 인원</ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1}>
              <Chip label={`전체 ${rows.length}명`} size="small" />
              <Chip label={`미달 ${shortfallCount}명`} size="small" color={shortfallCount ? "error" : "default"} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="small" aria-label="월별 출석 현황">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f6fa" }}>
                <TableCell sx={{ fontWeight: 800 }}>이름</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>참여</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>출석점수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 5, color: "text.secondary" }}>조회 결과가 없습니다.</TableCell></TableRow>
              ) : visibleRows.map((row) => (
                <TableRow
                  hover
                  key={row.id}
                  onClick={() => setSelected(row)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: view === "all" && row.isShortfall ? "#ffebee" : "inherit",
                    "&:hover": { bgcolor: row.isShortfall ? "#ffcdd2" : undefined },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>{row.name}</Typography>
                    {row.nickname && <Typography variant="caption" color="text.secondary">{row.nickname}</Typography>}
                  </TableCell>
                  <TableCell align="center">{row.meetings.length}회</TableCell>
                  <TableCell align="right">
                    <Chip label={`${row.point}점`} size="small" color={row.isShortfall ? "error" : "success"} sx={{ fontWeight: 800 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {selected?.name}님의 {Number(month.split("-")[1])}월 참여 모임
        </DialogTitle>
        <DialogContent dividers>
          {!selected?.meetings.length ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>참여한 마감 모임이 없습니다.</Typography>
          ) : (
            <Stack spacing={1.25}>
              {selected.meetings.map((meeting) => (
                <Box key={meeting.meeting_id} sx={{ p: 1.5, border: "1px solid #e5e7eb", borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography fontWeight={800}>{meeting.meeting_nm}</Typography>
                    <Chip label={`+${meeting.point}점`} size="small" color="primary" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatDateTime(meeting.meeting_dt)} · {meeting.meeting_tp === "REG" ? "정기모임" : "번개모임"} · {meeting.attendance_tp === "LAT" ? "지각" : "출석"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AttendanceStatusPage;
