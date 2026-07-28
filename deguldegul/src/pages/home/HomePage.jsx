import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CircleIcon from "@mui/icons-material/Circle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";

import { useAuth } from "../../contexts/AuthContext";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { fetchCapsuleDashboard } from "../../features/capsule/api/capsuleApi";
import { fetchHomeDashboard } from "../../features/home/api/homeApi";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

const BLUE = "#0868f7";
const SOFT_BLUE = "#f3f7fe";

function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getCodeName } = useCommonCodes();

  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [myAttendances, setMyAttendances] = useState({});
  const [notices, setNotices] = useState([]);
  const [freeBoards, setFreeBoards] = useState([]);
  const [boardTab, setBoardTab] = useState("NOT");
  const [myStat, setMyStat] = useState({
    avgScore: "-",
    highScore: "-",
    gameCnt: 0,
  });
  const [message, setMessage] = useState("");
  const [capsuleDashboard, setCapsuleDashboard] = useState(null);

  const selectedMeeting =
    upcomingMeetings.find((item) => item.meeting_id === selectedMeetingId) ||
    upcomingMeetings[0] ||
    null;
  const selectedAttendance = selectedMeeting
    ? myAttendances[selectedMeeting.meeting_id]
    : null;

  const goCalendarForMeeting = () => {
    if (!selectedMeeting) {
      navigate("/calendar");
      return;
    }

    const params = new URLSearchParams({
      date: getDateKey(selectedMeeting.meeting_dt),
      meetingId: String(selectedMeeting.meeting_id),
    });
    navigate(`/calendar?${params.toString()}`);
  };

  useEffect(() => {
    let active = true;

    fetchHomeDashboard(profile?.id).then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("");
      setUpcomingMeetings(data.meetings);
      setSelectedMeetingId((previous) =>
        data.meetings.some((item) => item.meeting_id === previous)
          ? previous
          : data.meetings[0]?.meeting_id || null
      );
      setMyAttendances(data.attendanceByMeeting);
      setNotices(data.notices);
      setFreeBoards(data.freeBoards);
      setMyStat(data.stats);
    });

    return () => {
      active = false;
    };
  }, [profile?.id]);

  useEffect(() => {
    fetchCapsuleDashboard().then(({ data, error }) => {
      if (!error && data?.round) setCapsuleDashboard(data);
    });
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f7f8",
        color: "#17191d",
        pb: 10,
        textAlign: "left",
        "& .MuiTypography-root": {
          fontFamily: 'Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", sans-serif',
          letterSpacing: "-0.025em",
        },
      }}
    >
      <Box sx={{ bgcolor: BLUE, color: "#fff", px: 2.25, pt: 2.5, pb: 2 }}>
        <Stack direction="row" sx={{ mb: 2, minHeight: 32, alignItems: "center" }}>
          <Typography sx={{ flex: 1, fontSize: 15, lineHeight: 1.4, fontWeight: 400 }}>
            안녕하세요! {profile?.nickname || profile?.name || "회원"}님! 😊
          </Typography>
          <IconButton aria-label="알림" sx={{ width: 36, height: 36, color: "#fff" }}>
            <NotificationsNoneRoundedIcon sx={{ fontSize: 23 }} />
          </IconButton>
        </Stack>

        {message && <Alert severity="error" sx={{ mb: 1.5 }}>{message}</Alert>}

        {upcomingMeetings.length > 0 ? (
          <Stack direction="row" spacing={1.2}>
            {upcomingMeetings.map((meeting) => (
              <MeetingMiniCard
                key={meeting.meeting_id}
                meeting={meeting}
                attendance={myAttendances[meeting.meeting_id]}
                selected={meeting.meeting_id === selectedMeeting?.meeting_id}
                onClick={() => setSelectedMeetingId(meeting.meeting_id)}
              />
            ))}
          </Stack>
        ) : (
          <Box sx={{ bgcolor: "rgba(255,255,255,.14)", borderRadius: 2, p: 2 }}>
            예정된 모임이 없습니다.
          </Box>
        )}
      </Box>

      {selectedMeeting && (
        <Box sx={{ bgcolor: "#fff", px: 2.25, py: 2, borderBottom: "4px solid #f5f5f6" }}>
          <Stack direction="row" spacing={0.7} sx={{ mb: 0.8 }}>
            <Chip
              label={getCodeName(COMMON_CODE_GROUP.MEETING_TYPE, selectedMeeting.meeting_tp)}
              size="small"
              sx={{ height: 22, bgcolor: "#eaf3ff", color: BLUE, fontSize: 10.5, fontWeight: 700 }}
            />
            <Chip
              label={getMeetingStatusLabel(selectedMeeting.status)}
              size="small"
              sx={{ height: 22, bgcolor: "#f1edff", color: "#7357d8", fontSize: 10.5, fontWeight: 700 }}
            />
          </Stack>

          <Typography color="#17191d" fontWeight={800} sx={{ mb: 1.4, fontSize: 16, lineHeight: 1.4 }}>
            {formatMeetingTitle(selectedMeeting)}
          </Typography>

          <Stack direction="row" spacing={1.2} sx={{ mb: 1.3 }}>
            <MeetingInfo label="장소" value={selectedMeeting.center?.center_nm || "-"} />
            <MeetingInfo label="시간" value={formatTime(selectedMeeting.meeting_dt)} />
            <MeetingInfo
              label="게임비"
              value={formatCost(selectedMeeting.center?.game_cost, selectedMeeting.meeting_tp)}
            />
          </Stack>

          <Button
            fullWidth
            variant="contained"
            onClick={goCalendarForMeeting}
            endIcon={<ChevronRightIcon />}
            sx={{
              height: 44,
              bgcolor: BLUE,
              borderRadius: 1.5,
              boxShadow: "none",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {selectedAttendance ? "참석정보 수정" : "참석투표하기"}
          </Button>
        </Box>
      )}

      <HomeSection
        title={boardTab === "NOT" ? "최신공지" : "자유게시판"}
        onMore={() => navigate(`/board?type=${boardTab}`)}
        boardTab={boardTab}
        onBoardTabChange={setBoardTab}
      >
        {(boardTab === "NOT" ? notices : freeBoards).length > 0 ? (
          (boardTab === "NOT" ? notices : freeBoards).map((notice, index, rows) => (
            <Box key={notice.board_id}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={() => navigate(`/board/${notice.board_id}`)}
                sx={{ py: 1.7, cursor: "pointer" }}
              >
                {boardTab === "NOT" && index === 0 && (
                  <CampaignOutlinedIcon sx={{ color: "#ff324a", fontSize: 19 }} />
                )}
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    color: "#25272b",
                    fontSize: 14,
                    fontWeight: boardTab === "NOT" && index === 0 ? 700 : 500,
                  }}
                >
                  {notice.title}
                </Typography>
                <Typography color="#555a63" sx={{ fontSize: 12.5 }}>
                  {formatShortDate(notice.created_at)}
                </Typography>
              </Stack>
              {index < rows.length - 1 && <Divider sx={{ borderColor: "#eceef1" }} />}
            </Box>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center", fontSize: 13 }}>
            등록된 게시글이 없습니다.
          </Typography>
        )}
      </HomeSection>

      <HomeSection title="개인통계" onMore={() => navigate("/ranking")}>
        <Stack direction="row" spacing={1.2}>
          <StatBox label="평균점수" value={myStat.avgScore} suffix="점" />
          <StatBox label="최고점수" value={myStat.highScore} suffix="점" />
          <StatBox label="총게임" value={myStat.gameCnt} suffix="게임" />
        </Stack>
      </HomeSection>

      <CapsuleBanner
        dashboard={capsuleDashboard}
        onClick={() => navigate("/capsule")}
      />
    </Box>
  );
}

function CapsuleBanner({ dashboard, onClick }) {
  const hasActiveRound = Boolean(dashboard?.round);
  const remainRate = hasActiveRound && dashboard.round.total_capsule_cnt
    ? Math.round(
        (dashboard.remain_capsule_cnt / dashboard.round.total_capsule_cnt) * 100
      )
    : 0;

  return (
    <Box sx={{ bgcolor: "#fff", px: 2.25, py: 1.7, borderBottom: "4px solid #f5f5f6" }}>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          width: "100%",
          border: 0,
          borderRadius: 2.5,
          p: 1.8,
          color: "#fff",
          textAlign: "left",
          cursor: "pointer",
          background:
            "radial-gradient(circle at 85% 20%, rgba(218,116,255,.38), transparent 35%), linear-gradient(135deg, #24103e, #7024b4)",
          boxShadow: "0 8px 22px rgba(89,33,137,.2)",
        }}
      >
        <Stack direction="row" alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography color="#d7a9ff" fontWeight={800} sx={{ fontSize: 11 }}>
              {hasActiveRound ? "진행 중인 이벤트" : "캡슐 이벤트"}
            </Typography>
            <Typography fontWeight={900} noWrap sx={{ mt: 0.35, fontSize: 17 }}>
              배틀로얄 캡슐 뽑기
            </Typography>
            <Typography color="#d6c9e1" noWrap sx={{ mt: 0.3, fontSize: 11 }}>
              {hasActiveRound
                ? `남은 캡슐 ${dashboard.remain_capsule_cnt}개 · 잔여율 ${remainRate}%`
                : "이벤트 준비 중 · 뽑기 화면 둘러보기"}
            </Typography>
          </Box>
          {hasActiveRound && <Box sx={{ textAlign: "center", ml: 1.5 }}>
            <MonetizationOnRoundedIcon sx={{ color: "#ffca28", fontSize: 28 }} />
            <Typography fontWeight={900} sx={{ fontSize: 15 }}>
              {dashboard.coin_balance}개
            </Typography>
          </Box>}
          <ChevronRightIcon sx={{ ml: 0.8 }} />
        </Stack>
      </Box>
    </Box>
  );
}

function MeetingMiniCard({ meeting, attendance, selected, onClick }) {
  const date = new Date(meeting.meeting_dt);
  const state = getAttendanceState(attendance?.attendance_tp);

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        border: selected ? "2px solid #fff" : "2px solid transparent",
        borderRadius: 2,
        bgcolor: "#fff",
        p: 1.25,
        minHeight: 100,
        boxSizing: "border-box",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: selected ? "0 5px 14px rgba(0,0,0,.18)" : "0 3px 10px rgba(0,0,0,.12)",
      }}
    >
      <Typography
        fontWeight={800}
        noWrap
        sx={{ color: selected ? `${BLUE} !important` : "#24262a", fontSize: 14, lineHeight: 1.35 }}
      >
        {formatCardDate(date)}
      </Typography>
      <Typography color="#454950" sx={{ mt: 0.15, fontSize: 13, lineHeight: 1.35 }} noWrap>
        {formatTime(meeting.meeting_dt)}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.7 }}>
        <Typography color="#34373d" noWrap sx={{ flex: 1, fontSize: 13, lineHeight: 1.35 }}>
          {shortCenterName(meeting.center?.center_nm)}
        </Typography>
        {state.icon}
      </Stack>
    </Box>
  );
}

function MeetingInfo({ label, value }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 62, bgcolor: SOFT_BLUE, borderRadius: 1.5, p: 1.2, boxSizing: "border-box" }}>
      <Typography
        fontWeight={800}
        sx={{ color: `${BLUE} !important`, fontSize: 12, lineHeight: 1.3 }}
      >
        {label}
      </Typography>
      <Typography color="#202329" fontWeight={600} noWrap sx={{ mt: 0.35, fontSize: 14, lineHeight: 1.35 }}>{value}</Typography>
    </Box>
  );
}

function HomeSection({ title, onMore, boardTab, onBoardTabChange, children }) {
  return (
    <Box sx={{ bgcolor: "#fff", mt: 0.5, px: 2.25, pt: 2, pb: 2.2 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.2, minHeight: 24 }}>
        {onBoardTabChange ? (
          <Stack direction="row" spacing={2}>
            <SectionTab
              active={boardTab === "NOT"}
              onClick={() => onBoardTabChange("NOT")}
            >
              최신공지
            </SectionTab>
            <SectionTab
              active={boardTab === "FRI"}
              onClick={() => onBoardTabChange("FRI")}
            >
              자유게시판
            </SectionTab>
          </Stack>
        ) : (
          <Typography color="#191b1f" sx={{ fontSize: 15, lineHeight: 1.3, fontWeight: 400 }}>
            {title}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton aria-label={`${title} 더보기`} size="small" onClick={onMore}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
      {children}
    </Box>
  );
}

function SectionTab({ active, onClick, children }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        appearance: "none",
        border: 0,
        bgcolor: "transparent",
        color: active ? "#181a1e" : "#a4a7ad",
        p: 0,
        font: "inherit",
        fontWeight: active ? 800 : 500,
        fontSize: 15,
        lineHeight: 1.3,
        cursor: "pointer",
      }}
    >
      {children}
    </Box>
  );
}

function StatBox({ label, value, suffix }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        height: 69,
        boxSizing: "border-box",
        bgcolor: "#f5f6f8",
        borderRadius: 1.7,
        px: 1.25,
        py: 1.05,
      }}
    >
      <Typography color="#25282e" sx={{ fontSize: 12, lineHeight: 1.25, fontWeight: 400 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={0.3}
        sx={{
          mt: 0.55,
          width: "100%",
          minHeight: 23,
          alignItems: "flex-end",
          justifyContent: "flex-end",
          whiteSpace: "nowrap",
        }}
      >
        <Typography
          sx={{ color: `${BLUE} !important`, fontSize: 22, lineHeight: 1, fontWeight: 400 }}
        >
          {value}
        </Typography>
        <Typography color="#4f535b" sx={{ fontSize: 11, lineHeight: 1 }}>{suffix}</Typography>
      </Stack>
    </Box>
  );
}

function getAttendanceState(type) {
  if (["ATD", "LAT"].includes(type)) {
    return { icon: <CheckCircleIcon sx={{ color: BLUE, fontSize: 19 }} /> };
  }
  if (type === "ABS") {
    return { icon: <HighlightOffIcon sx={{ color: "#ff6b78", fontSize: 19 }} /> };
  }
  return { icon: <CircleIcon sx={{ color: "#d2d5da", fontSize: 19 }} /> };
}

function formatCardDate(date) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${weekdays[date.getDay()]}요일`;
}

function formatMeetingTitle(meeting) {
  const date = new Date(meeting.meeting_dt);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${meeting.meeting_nm}`;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatCost(cost, meetingType) {
  const unitCost = Number(cost || 0);
  if (!unitCost) return "-";
  return `${(unitCost * (meetingType === "REG" ? 4 : 1)).toLocaleString()}원`;
}

function formatShortDate(value) {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function getMeetingStatusLabel(status) {
  return status === "OPN" ? "진행" : status === "CLS" ? "마감" : "취소";
}

function shortCenterName(value) {
  if (!value) return "-";
  return value.replaceAll("볼링센터", "").replaceAll("볼링장", "").replaceAll("볼링", "").trim();
}

function getDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default HomePage;
