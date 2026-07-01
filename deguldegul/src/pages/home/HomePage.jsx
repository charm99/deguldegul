import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Alert,
  Divider,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CampaignIcon from "@mui/icons-material/Campaign";
import BarChartIcon from "@mui/icons-material/BarChart";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [myAttendances, setMyAttendances] = useState({});
  const [notice, setNotice] = useState(null);
  const [myStat, setMyStat] = useState({
    avgScore: "-",
    highScore: "-",
    gameCnt: 0,
  });
  const [message, setMessage] = useState("");

  const selectedMeeting =
    upcomingMeetings.find((item) => item.meeting_id === selectedMeetingId) ||
    upcomingMeetings[0] ||
    null;

  const selectedAttendance = selectedMeeting
    ? myAttendances[selectedMeeting.meeting_id]
    : null;

  const loadHomeData = async () => {
    setMessage("");

    const now = new Date().toISOString();

    const { data: meetingData, error: meetingError } = await supabase
      .from("degul_meeting")
      .select(`
        meeting_id,
        meeting_nm,
        meeting_tp,
        meeting_dt,
        status,
        memo,
        center:center_id (
          center_nm,
          address
        )
      `)
      .eq("use_yn", "Y")
      .neq("status", "CNL")
      .gte("meeting_dt", now)
      .order("meeting_dt", { ascending: true })
      .limit(3);

    if (meetingError) {
      setMessage(meetingError.message);
      return;
    }

    const meetings = meetingData || [];
    setUpcomingMeetings(meetings);
    setSelectedMeetingId((prev) => prev || meetings[0]?.meeting_id || null);

    if (profile?.id && meetings.length > 0) {
      const meetingIds = meetings.map((item) => item.meeting_id);

      const { data: attendanceData } = await supabase
        .from("degul_attendance")
        .select("*")
        .eq("user_id", profile.id)
        .in("meeting_id", meetingIds);

      const attendanceMap = {};

      (attendanceData || []).forEach((item) => {
        attendanceMap[item.meeting_id] = item;
      });

      setMyAttendances(attendanceMap);
    } else {
      setMyAttendances({});
    }

    const { data: noticeData, error: noticeError } = await supabase
      .from("degul_board")
      .select(`
        board_id,
        title,
        created_at,
        view_cnt,
        writer:writer_id (
          name,
          nickname
        )
      `)
      .eq("board_tp", "NOT")
      .eq("use_yn", "Y")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (noticeError) {
      setMessage(noticeError.message);
      return;
    }

    setNotice(noticeData || null);

    if (profile?.id) {
      const { data: scoreData, error: scoreError } = await supabase
        .from("degul_score")
        .select("score")
        .eq("user_id", profile.id);

      if (scoreError) {
        setMessage(scoreError.message);
        return;
      }

      const scores = scoreData || [];
      const gameCnt = scores.length;
      const highScore =
        gameCnt > 0 ? Math.max(...scores.map((item) => item.score)) : "-";
      const avgScore =
        gameCnt > 0
          ? (
              scores.reduce((sum, item) => sum + item.score, 0) / gameCnt
            ).toFixed(1)
          : "-";

      setMyStat({
        avgScore,
        highScore,
        gameCnt,
      });
    }
  };

  const goCalendarForMeeting = () => {
    if (!selectedMeeting) {
      navigate("/calendar");
      return;
    }

    navigate("/calendar", {
      state: {
        meetingId: selectedMeeting.meeting_id,
        meetingDate: getDateKey(selectedMeeting.meeting_dt),
      },
    });
  };

  useEffect(() => {
    loadHomeData();
  }, [profile?.id]);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1.2}
        sx={{ mb: 1.5 }}
      >
        <Box
          component="img"
          src={logo}
          alt="데굴데굴"
          sx={{
            width: 44,
            height: 44,
            objectFit: "contain",
          }}
        />

        <Typography variant="h5" fontWeight={900}>
          안녕하세요, {profile?.nickname || profile?.name || "회원"}님 👋
        </Typography>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={cardSx}>
        <CardContent sx={{ p: 2.4 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon color="primary" />
              <Typography fontWeight={900} fontSize={20}>
                다가오는 모임
              </Typography>
            </Stack>
          </Stack>

          {upcomingMeetings.length > 0 ? (
            <>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {upcomingMeetings.map((meeting) => (
                  <MeetingMiniCard
                    key={meeting.meeting_id}
                    meeting={meeting}
                    selected={meeting.meeting_id === selectedMeeting?.meeting_id}
                    onClick={() => setSelectedMeetingId(meeting.meeting_id)}
                  />
                ))}
              </Stack>

              {selectedMeeting && (
                <>
                  <Box sx={{ mb: 1.5 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap>
                          {selectedMeeting.meeting_nm}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.7}
                          alignItems="center"
                          sx={{ mt: 0.7 }}
                        >
                          <PlaceOutlinedIcon
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={700}
                            noWrap
                          >
                            {selectedMeeting.center?.center_nm || "-"}
                          </Typography>
                        </Stack>
                      </Box>

                      <Chip
                        label={getMeetingTypeLabel(selectedMeeting.meeting_tp)}
                        size="small"
                        color={
                          selectedMeeting.meeting_tp === "REG"
                            ? "primary"
                            : "default"
                        }
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.6,
                      borderRadius: 3,
                      bgcolor: "#f3f7ff",
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          내 참석 상태
                        </Typography>

                        <Typography
                          fontWeight={900}
                          color="primary.main"
                          fontSize={18}
                        >
                          {selectedAttendance
                            ? getAttendanceLabel(selectedAttendance.attendance_tp)
                            : "미투표"}
                          {selectedAttendance?.battle_join_yn === "Y"
                            ? " · 배틀참가"
                            : ""}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="medium"
                        endIcon={<ChevronRightIcon />}
                        startIcon={<EventAvailableIcon />}
                        onClick={goCalendarForMeeting}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          bgcolor: "#fff",
                        }}
                      >
                        투표하기
                      </Button>
                    </Stack>
                  </Box>
                </>
              )}
            </>
          ) : (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
              예정된 모임이 없습니다.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent sx={{ p: 2.4 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <CampaignIcon color="primary" sx={{ mr: 1 }} />

            <Typography fontWeight={900} fontSize={20}>
              최신 공지
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Stack
              direction="row"
              spacing={0.2}
              alignItems="center"
              onClick={() => navigate("/board")}
              sx={{
                cursor: "pointer",
                color: "text.secondary",
              }}
            >
              <Typography fontWeight={700} fontSize={14}>
                더보기
              </Typography>
              <ChevronRightIcon fontSize="small" />
            </Stack>
          </Stack>
          

          {notice ? (
            <Box
              onClick={() => navigate(`/board/${notice.board_id}`)}
              sx={{ cursor: "pointer" }}
            >
              <Typography fontWeight={900}>{notice.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                {notice.writer?.nickname || notice.writer?.name || "-"} ·{" "}
                {formatDate(notice.created_at)} · 조회 {notice.view_cnt}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography color="text.secondary">등록된 공지가 없습니다.</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                새로운 소식을 기대해 주세요!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent sx={{ p: 2.4 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <BarChartIcon color="primary" sx={{ mr: 1 }} />

            <Typography fontWeight={900} fontSize={20}>
              개인통계
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Stack
              direction="row"
              spacing={0.2}
              alignItems="center"
              onClick={() => navigate("/ranking")}
              sx={{
                cursor: "pointer",
                color: "text.secondary",
              }}
            >
              <Typography fontWeight={700} fontSize={14}>
                더보기
              </Typography>
              <ChevronRightIcon fontSize="small" />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.2}>
            <StatBox label="평균" value={myStat.avgScore} suffix="점" />
            <StatBox label="최고" value={myStat.highScore} suffix="점" />
            <StatBox label="게임" value={myStat.gameCnt} suffix="게임" />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function MeetingMiniCard({ meeting, selected, onClick }) {
  const date = new Date(meeting.meeting_dt);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const week = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  const time = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 3,
        p: 1.1,
        textAlign: "center",
        cursor: "pointer",
        border: selected ? "2px solid #1976d2" : "1px solid #edf1f7",
        bgcolor: selected ? "#eaf4ff" : "#f6f8fc",
      }}
    >
      <Typography fontWeight={900} color="primary.main" fontSize={18}>
        {month}.{day}
      </Typography>

      <Typography fontWeight={800} color="text.secondary" fontSize={13}>
        {week}요일
      </Typography>

      <Typography fontWeight={800} fontSize={13} sx={{ mt: 0.6 }}>
        {time}
      </Typography>

      <Divider sx={{ my: 0.8 }} />

      <Typography fontWeight={900} fontSize={13} noWrap>
        {shortCenterName(meeting.center?.center_nm)}
      </Typography>
    </Box>
  );
}

function StatBox({ label, value, suffix }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#f6f8fc",
        borderRadius: 3,
        p: 1.4,
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary" fontWeight={800}>
        {label}
      </Typography>
      <Typography fontWeight={900} fontSize={26} color="primary.main">
        {value}
      </Typography>
      <Typography variant="body2" fontWeight={800}>
        {suffix}
      </Typography>
    </Box>
  );
}

function shortCenterName(value) {
  if (!value) return "-";

  return value
    .replaceAll("볼링장", "")
    .replaceAll("볼링센터", "")
    .replaceAll("볼링", "")
    .trim()
    .slice(0, 5);
}

function getMeetingTypeLabel(value) {
  const map = {
    REG: "정기전",
    FLS: "번개",
    EVT: "이벤트",
  };

  return map[value] || value;
}

function getAttendanceLabel(value) {
  const map = {
    ATD: "참석",
    LAT: "늦참",
    PND: "보류",
    ABS: "불참",
  };

  return map[value] || "미투표";
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

function getDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const cardSx = {
  borderRadius: 4,
  mb: 2,
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export default HomePage;