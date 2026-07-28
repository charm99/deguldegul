import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Alert,
  Box,
  Fab,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";

import { useAuth } from "../../contexts/AuthContext";
import {
  cancelOwnedFlashMeeting,
  closeOwnedFlashMeeting,
  createFlashMeeting,
  deleteUserScores,
  fetchActiveCenters,
  fetchBattleEntries,
  fetchBattleMatches,
  fetchCalendarMeetings,
  fetchMeetingAttendances,
  fetchUserAttendances,
  fetchUserScores,
  generateBattleMatches,
  insertScores,
  saveAttendance,
} from "../../features/calendar/api/calendarApi";

import EmptyState from "./components/EmptyState";
import FlashMeetingDialog from "./components/FlashMeetingDialog";
import Legend from "./components/Legend";
import MeetingCard from "./components/MeetingCard";
import ScoreDialog from "./components/ScoreDialog";
import VoteDialog from "./components/VoteDialog";
import BattleMatchDialog from "./components/BattleMatchDialog";
import AttendanceListDialog from "./components/AttendanceListDialog";

import {
  WEEK_LABELS,
  formatDateKey,
  getCalendarDays,
  getDateKeyFromValue,
  toKoreanDate,
} from "./utils/calendarUtils";

const EMPTY_FLASH_FORM = {
  meeting_nm: "",
  center_id: "",
  meeting_dt: "",
  max_member_cnt: "",
  memo: "",
};

const SCORE_DRAFT_PREFIX = "degul-score-draft";
const ACTIVE_SCORE_PREFIX = "degul-active-score";

function CalendarPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const initialDate = getInitialCalendarDate(searchParams.get("date"));

  const [tab, setTab] = useState(0);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(initialDate));

  const [meetings, setMeetings] = useState([]);
  const [centers, setCenters] = useState([]);
  const [scores, setScores] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [, setBattleEntries] = useState([]);
  const [message, setMessage] = useState("");

  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [scoreInputs, setScoreInputs] = useState([]);

  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [voteMeeting, setVoteMeeting] = useState(null);
  const [voteForm, setVoteForm] = useState({
    attendance_tp: "ATD",
    battle_join_yn: "N",
    memo: "",
  });

  const [flashDialogOpen, setFlashDialogOpen] = useState(false);
  const [flashForm, setFlashForm] = useState(EMPTY_FLASH_FORM);

  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  const [battleDialogOpen, setBattleDialogOpen] = useState(false);
  const [battleMeeting, setBattleMeeting] = useState(null);
  const [battleMatches, setBattleMatches] = useState([]);

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceMeeting, setAttendanceMeeting] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

  const monthTitle = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;

  const selectedMeetings = meetings.filter(
    (meeting) => getDateKeyFromValue(meeting.meeting_dt) === selectedDate
  );

  const loadCenters = async () => {
    const { data, error } = await fetchActiveCenters();

    if (error) {
      setMessage(error.message);
      return;
    }

    setCenters(data || []);
  };

  const loadMeetings = async () => {
    setMessage("");

    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );

    const { data, error } = await fetchCalendarMeetings(
      monthStart.toISOString(),
      monthEnd.toISOString()
    );

    if (error) {
      setMessage(error.message || "모임 조회 중 오류가 발생했습니다.");
      return;
    }

    setMeetings(data || []);
  };

  const loadScores = async () => {
    if (!profile?.id) return;

    const meetingIds = meetings.map((meeting) => meeting.meeting_id);

    if (meetingIds.length === 0) {
      setScores([]);
      return;
    }

    const { data, error } = await fetchUserScores(profile.id, meetingIds);

    if (error) {
      setMessage(error.message || "점수 조회 중 오류가 발생했습니다.");
      return;
    }

    setScores(data || []);
  };

  const loadMyAttendances = async () => {
    if (!profile?.id) return;

    const meetingIds = meetings.map((meeting) => meeting.meeting_id);

    if (meetingIds.length === 0) {
      setMyAttendances([]);
      return;
    }

    const { data, error } = await fetchUserAttendances(profile.id, meetingIds);

    if (error) {
      setMessage(error.message || "내 참석정보 조회 중 오류가 발생했습니다.");
      return;
    }

    setMyAttendances(data || []);
  };

  const loadBattleEntries = async () => {
    const meetingIds = meetings.map((meeting) => meeting.meeting_id);

    if (meetingIds.length === 0) {
      setBattleEntries([]);
      return;
    }

    const { data, error } = await fetchBattleEntries(meetingIds);

    if (error) {
      console.error(error);
      setBattleEntries([]);
      return;
    }

    setBattleEntries(data || []);
  };

  useEffect(() => {
    loadCenters();
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [currentDate]);

  useEffect(() => {
    loadScores();
    loadMyAttendances();
    loadBattleEntries();
  }, [meetings, profile?.id]);

  const moveMonth = (amount) => {
    const nextDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + amount,
      1
    );

    setCurrentDate(nextDate);
    setSelectedDate(formatDateKey(nextDate));
  };

  const getDayMarks = (dateKey) => {
    const hasMeeting = meetings.some(
      (meeting) => getDateKeyFromValue(meeting.meeting_dt) === dateKey
    );

    const hasScore = scores.some((score) => {
      const meeting = meetings.find((item) => item.meeting_id === score.meeting_id);
      return meeting && getDateKeyFromValue(meeting.meeting_dt) === dateKey;
    });

    const marks = [];
    if (hasScore) marks.push("score");
    if (hasMeeting) marks.push("meeting");

    return marks;
  };

  const openScoreDialog = useCallback((meeting) => {
    setSelectedMeeting(meeting);

    const savedScores = scores
      .filter((score) => score.meeting_id === meeting.meeting_id)
      .sort((a, b) => a.game_no - b.game_no);
    const draftScores = readScoreDraft(profile?.id, meeting.meeting_id);

    setScoreInputs(
      normalizeScoreInputs(meeting, draftScores || savedScores)
    );

    setScoreDialogOpen(true);
    writeActiveScoreMeeting(profile?.id, meeting);
  }, [profile?.id, scores]);

  const closeScoreDialog = () => {
    setScoreDialogOpen(false);
    clearActiveScoreMeeting(profile?.id);
  };

  useEffect(() => {
    if (!scoreDialogOpen || !selectedMeeting || !profile?.id) return;
    writeScoreDraft(profile.id, selectedMeeting.meeting_id, scoreInputs);
  }, [scoreDialogOpen, scoreInputs, selectedMeeting, profile?.id]);

  useEffect(() => {
    if (!profile?.id || meetings.length === 0 || scoreDialogOpen) return;

    const activeMeeting = readActiveScoreMeeting(profile.id);
    if (!activeMeeting) return;

    const meeting = meetings.find(
      (item) => item.meeting_id === activeMeeting.meetingId
    );

    queueMicrotask(() => {
      if (meeting) {
        setSelectedDate(getDateKeyFromValue(meeting.meeting_dt));
        openScoreDialog(meeting);
        return;
      }

      const meetingDate = new Date(activeMeeting.meetingDate);
      if (!Number.isNaN(meetingDate.getTime())) {
        setCurrentDate(meetingDate);
        setSelectedDate(formatDateKey(meetingDate));
      }
    });
  }, [meetings, profile?.id, scoreDialogOpen, openScoreDialog]);

  const openVoteDialog = (meeting) => {
    const saved = myAttendances.find(
      (attendance) => attendance.meeting_id === meeting.meeting_id
    );

    setVoteMeeting(meeting);
    setVoteForm({
      attendance_tp: saved?.attendance_tp || "ATD",
      battle_join_yn: saved?.battle_join_yn || "N",
      memo: saved?.memo || "",
    });
    setVoteDialogOpen(true);
  };

  const saveVote = async () => {
    if (!voteMeeting || !profile?.id) return;

    if (
      ["PND", "ABS"].includes(voteForm.attendance_tp) &&
      voteForm.battle_join_yn === "Y"
    ) {
      alert("보류 또는 불참 상태에서는 배틀로얄에 참가할 수 없습니다.");
      return;
    }

    const payload = {
      meeting_id: voteMeeting.meeting_id,
      user_id: profile.id,
      attendance_tp: voteForm.attendance_tp,
      battle_join_yn: voteForm.battle_join_yn,
      memo: voteForm.memo,
      updated_at: new Date().toISOString(),
    };

    const { error } = await saveAttendance(payload);

    if (error) {
      alert(error.message);
      return;
    }

    setVoteDialogOpen(false);
    await loadMyAttendances();
    await loadBattleEntries();
  };

  const openFlashDialog = () => {
    setFlashForm({
      ...EMPTY_FLASH_FORM,
      meeting_dt: `${selectedDate}T21:00`,
    });

    setFlashDialogOpen(true);
  };

  const saveFlashMeeting = async () => {
    if (!flashForm.meeting_nm.trim() || !flashForm.center_id || !flashForm.meeting_dt) {
      alert("모임명, 볼링장, 일시는 필수입니다.");
      return;
    }

    const { error } = await createFlashMeeting({
      meeting_nm: flashForm.meeting_nm.trim(),
      meeting_tp: "FLS",
      center_id: flashForm.center_id,
      meeting_dt: koreanDateTimeLocalToUtcIso(flashForm.meeting_dt),
      max_member_cnt: flashForm.max_member_cnt
        ? Number(flashForm.max_member_cnt)
        : null,
      memo: flashForm.memo.trim(),
      status: "OPN",
      use_yn: "Y",
      created_by: profile.id,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setFlashDialogOpen(false);
    setFlashForm(EMPTY_FLASH_FORM);
    await loadMeetings();
  };
  const closeFlashMeeting = async (meeting) => {
    if (meeting.meeting_tp !== "FLS") return;

    if (meeting.created_by !== profile?.id) {
      alert("번개 개설자만 마감할 수 있습니다.");
      return;
    }

    const ok = confirm(
      "번개를 마감하고 배틀로얄 대진표를 생성할까요?\n마감 후에는 참석 투표를 수정할 수 없습니다."
    );

    if (!ok) return;

    const { error: updateError } = await closeOwnedFlashMeeting(
      meeting.meeting_id,
      profile.id
    );

    if (updateError) {
      alert(updateError.message);
      return;
    }

    const { error: battleError } = await generateBattleMatches(meeting.meeting_id);

    if (battleError) {
      alert(`대진표 생성 실패: ${battleError.message}`);
      return;
    }

    await loadMeetings();
  };
  const deleteFlashMeeting = async (meeting) => {
    if (meeting.meeting_tp !== "FLS") return;

    if (meeting.created_by !== profile?.id) {
      alert("번개 개설자만 삭제할 수 있습니다.");
      return;
    }

    if (meeting.status !== "OPN") {
      alert("모집중인 번개만 삭제할 수 있습니다.");
      return;
    }

    const ok = confirm(
      "번개 모임을 삭제할까요?\n삭제 후 캘린더에서 보이지 않습니다."
    );

    if (!ok) return;

    const { error } = await cancelOwnedFlashMeeting(meeting.meeting_id, profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadMeetings();
  };

  const addGame = () => {
    setScoreInputs([
      ...scoreInputs,
      {
        game_no: scoreInputs.length + 1,
        score: "",
      },
    ]);
  };

  const removeGame = (index) => {
    const next = scoreInputs
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({
        ...item,
        game_no: itemIndex + 1,
      }));

    setScoreInputs(next);
  };

  const updateScoreInput = (index, value) => {
    if (value && (Number(value) < 0 || Number(value) > 300)) return;

    const next = [...scoreInputs];

    next[index] = {
      ...next[index],
      score: value,
    };

    setScoreInputs(next);
  };

  const saveScores = async () => {
    if (!selectedMeeting || !profile?.id) return;

    const validScores = scoreInputs
      .filter((item) => item.score !== "")
      .map((item, index) => ({
        meeting_id: selectedMeeting.meeting_id,
        user_id: profile.id,
        game_no: index + 1,
        score: Number(item.score),
      }));

    const invalid = validScores.some(
      (item) => item.score < 0 || item.score > 300 || Number.isNaN(item.score)
    );

    if (invalid) {
      alert("점수는 0~300 사이로 입력해주세요.");
      return;
    }

    const { error: deleteError } = await deleteUserScores(
      selectedMeeting.meeting_id,
      profile.id
    );

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    if (validScores.length > 0) {
      const { error: insertError } = await insertScores(validScores);

      if (insertError) {
        alert(insertError.message);
        return;
      }
    }

    clearScoreDraft(profile.id, selectedMeeting.meeting_id);
    clearActiveScoreMeeting(profile.id);
    setScoreDialogOpen(false);
    await loadScores();
  };

  const deleteScores = async () => {
    if (!selectedMeeting || !profile?.id) return;

    if (!confirm("해당 모임의 내 점수를 모두 삭제할까요?")) return;

    const { error } = await deleteUserScores(selectedMeeting.meeting_id, profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    clearScoreDraft(profile.id, selectedMeeting.meeting_id);
    clearActiveScoreMeeting(profile.id);
    setScoreDialogOpen(false);
    await loadScores();
  };

  const renderSelectedContent = () => {
    const openBattleDialog = async (meeting) => {
      if (meeting.status !== "CLS") {
        alert("모임이 마감된 후 확인 가능합니다.");
        return;
      }

      setBattleMeeting(meeting);

      const { data, error } = await fetchBattleMatches(meeting.meeting_id);

      if (error) {
        alert(error.message);
        return;
      }

      setBattleMatches(data || []);
      setBattleDialogOpen(true);
    };
    const openAttendanceListDialog = async (meeting) => {
      setAttendanceMeeting(meeting);

      const { data, error } = await fetchMeetingAttendances(meeting.meeting_id);

      if (error) {
        alert(error.message);
        return;
      }

      setAttendanceList(data || []);
      setAttendanceDialogOpen(true);
    };

    if (tab === 1) {
      return <EmptyState text="이벤트 기능은 추후 구현 예정입니다." />;
    }

    return (
      <Stack spacing={0}>
        <Typography fontWeight={800} sx={{ display: "none" }}>
          {toKoreanDate(selectedDate)} 모임 일정
        </Typography>

        {selectedMeetings.length === 0 ? (
          <EmptyState text="선택한 날짜에 등록된 모임이 없습니다." />
        ) : (
          selectedMeetings.map((meeting) => {
            const myAttendance = myAttendances.find(
              (attendance) => attendance.meeting_id === meeting.meeting_id
            );
            const myScores = scores
              .filter((score) => score.meeting_id === meeting.meeting_id)
              .sort((a, b) => a.game_no - b.game_no);

            return (
              <MeetingCard
                key={meeting.meeting_id}
                meeting={meeting}
                attendance={myAttendance}
                scores={myScores}
                profile={profile}
                onScoreClick={() => openScoreDialog(meeting)}
                onVoteClick={() => openVoteDialog(meeting)}
                onBattleClick={() => openBattleDialog(meeting)}
                onCloseFlashClick={() => closeFlashMeeting(meeting)}
                onDeleteFlashClick={() => deleteFlashMeeting(meeting)}
                onAttendanceListClick={() => openAttendanceListDialog(meeting)}
              />
            );
          })
        )}
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "calc(100vh - 72px)",
        bgcolor: "#f7f7f8",
        color: "#17191d",
        textAlign: "left",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiTab-root": {
          fontFamily: 'Pretendard, "Noto Sans KR", "Segoe UI", sans-serif',
          letterSpacing: "-0.025em",
        },
      }}
    >
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ display: "none" }}>
        캘린더
      </Typography>

      <Box sx={{ position: "sticky", top: 0, zIndex: 1100, bgcolor: "#fff", px: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, value) => setTab(value)}
          variant="fullWidth"
          sx={{
            minHeight: 58,
            borderBottom: "1px solid #f0f1f3",
            "& .MuiTab-root": {
              minHeight: 58,
              py: 0,
              color: "#a5a8ae",
              fontSize: 14,
              fontWeight: 500,
            },
            "& .Mui-selected": { color: "#0868f7 !important", fontWeight: 800 },
            "& .MuiTabs-indicator": { height: 2, bgcolor: "#0868f7" },
          }}
        >
          <Tab label="모임" />
          <Tab label="이벤트" />
        </Tabs>
      </Box>  
      {message && (
        <Alert severity="error" sx={{ m: 2 }}>
          {message}
        </Alert>
      )}

      <Box sx={{ bgcolor: "#fff", px: 2.5, pt: 1.8, pb: 2.5 }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          minHeight: 32,
          mb: 1,
        }}
      >
        <IconButton size="small" onClick={() => moveMonth(-1)} sx={{ width: 32, height: 32 }}>
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>

        <Typography
          fontWeight={800}
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: "max-content",
            fontSize: 16,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {monthTitle}
        </Typography>

        <IconButton
          size="small"
          onClick={() => moveMonth(1)}
          sx={{ width: 32, height: 32 }}
        >
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 0.5 }}>
        {WEEK_LABELS.map((label) => (
          <Typography
            key={label}
            fontWeight={500}
            color="#858991"
            sx={{
              py: 0.9,
              width: "100%",
              fontSize: 13,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          rowGap: 0.35,
          mb: 0,
        }}
      >
        {calendarDays.map((item) => {
          const dateKey = formatDateKey(item.date);
          const isSelected = selectedDate === dateKey;
          const isToday = formatDateKey(new Date()) === dateKey;
          const marks = getDayMarks(dateKey);
          const dayOfWeek = item.date.getDay();

          return (
            <Box
              key={dateKey}
              onClick={() => setSelectedDate(dateKey)}
              sx={{
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isSelected ? "#0868f7" : "transparent",
                  border: isToday && !isSelected ? "2px solid #0868f7" : "2px solid transparent",
                  boxSizing: "border-box",
                  color: isSelected
                    ? "#fff"
                    : !item.currentMonth
                    ? "text.disabled"
                    : dayOfWeek === 0
                    ? "#25282d"
                    : dayOfWeek === 6
                    ? "#25282d"
                    : "#25282d",
                  fontWeight: isSelected || isToday ? 800 : 500,
                  fontSize: 15,
                }}
              >
                {item.day}
              </Box>

              <Stack
                direction="row"
                spacing={0.3}
                sx={{
                  position: "absolute",
                  bottom: isSelected || isToday ? 4 : 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {marks.map((mark) => (
                  <Box
                    key={mark}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: mark === "score" ? "#42d6b3" : "#804bff",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>

      </Box>

      <Stack direction="row" spacing={2} sx={{ display: "none" }}>
        <Legend color="#1976d2" label="모임" />
        <Legend color="#43a047" label="점수입력" />
      </Stack>

      <Box sx={{ mt: 1, bgcolor: "#fff" }}>{renderSelectedContent()}</Box>

      {tab === 0 && (
        <Fab
          color="primary"
          onClick={openFlashDialog}
          sx={{
            position: "fixed",
            bottom: "calc(88px + env(safe-area-inset-bottom))",
            right: "max(20px, calc((100vw - 375px) / 2 + 20px))",
            zIndex: 1200,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <ScoreDialog
        open={scoreDialogOpen}
        meeting={selectedMeeting}
        scoreInputs={scoreInputs}
        onClose={closeScoreDialog}
        onAddGame={addGame}
        onRemoveGame={removeGame}
        onUpdateScore={updateScoreInput}
        onSave={saveScores}
        onDelete={deleteScores}
      />

      <VoteDialog
        open={voteDialogOpen}
        meeting={voteMeeting}
        voteForm={voteForm}
        setVoteForm={setVoteForm}
        onClose={() => setVoteDialogOpen(false)}
        onSave={saveVote}
      />

      <FlashMeetingDialog
        open={flashDialogOpen}
        centers={centers}
        form={flashForm}
        setForm={setFlashForm}
        onClose={() => setFlashDialogOpen(false)}
        onSave={saveFlashMeeting}
      />
      <BattleMatchDialog
        open={battleDialogOpen}
        meeting={battleMeeting}
        matches={battleMatches}
        onClose={() => setBattleDialogOpen(false)}
      />
      <AttendanceListDialog
        open={attendanceDialogOpen}
        meeting={attendanceMeeting}
        attendances={attendanceList}
        onClose={() => setAttendanceDialogOpen(false)}
      />
    </Box>
  );
}

function normalizeScoreInputs(meeting, sourceScores) {
  const normalized = (sourceScores || [])
    .map((item, index) => ({
      game_no: Number(item.game_no) || index + 1,
      score:
        item.score === "" || item.score === null || item.score === undefined
          ? ""
          : String(item.score),
    }))
    .sort((a, b) => a.game_no - b.game_no);

  if (meeting.meeting_tp === "REG") {
    return Array.from({ length: 4 }, (_, index) => {
      const gameNo = index + 1;
      const savedGame = normalized.find((item) => item.game_no === gameNo);
      return {
        game_no: gameNo,
        score: savedGame?.score || "",
      };
    });
  }

  if (normalized.length > 0) return normalized;

  return Array.from({ length: 4 }, (_, index) => ({
    game_no: index + 1,
    score: "",
  }));
}

function getScoreDraftKey(userId, meetingId) {
  return `${SCORE_DRAFT_PREFIX}:${userId}:${meetingId}`;
}

function getActiveScoreKey(userId) {
  return `${ACTIVE_SCORE_PREFIX}:${userId}`;
}

function readScoreDraft(userId, meetingId) {
  if (!userId || !meetingId) return null;

  try {
    const value = JSON.parse(localStorage.getItem(getScoreDraftKey(userId, meetingId)));
    return Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function writeScoreDraft(userId, meetingId, scoreInputs) {
  try {
    localStorage.setItem(
      getScoreDraftKey(userId, meetingId),
      JSON.stringify(scoreInputs)
    );
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 현재 화면의 React 상태를 유지합니다.
  }
}

function clearScoreDraft(userId, meetingId) {
  try {
    localStorage.removeItem(getScoreDraftKey(userId, meetingId));
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 무시합니다.
  }
}

function writeActiveScoreMeeting(userId, meeting) {
  if (!userId || !meeting) return;

  try {
    localStorage.setItem(
      getActiveScoreKey(userId),
      JSON.stringify({
        meetingId: meeting.meeting_id,
        meetingDate: meeting.meeting_dt,
      })
    );
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 현재 화면의 React 상태를 유지합니다.
  }
}

function readActiveScoreMeeting(userId) {
  if (!userId) return null;

  try {
    const value = JSON.parse(localStorage.getItem(getActiveScoreKey(userId)));
    return value?.meetingId ? value : null;
  } catch {
    return null;
  }
}

function clearActiveScoreMeeting(userId) {
  if (!userId) return;

  try {
    localStorage.removeItem(getActiveScoreKey(userId));
  } catch {
    // 저장 공간을 사용할 수 없는 환경에서는 무시합니다.
  }
}

function koreanDateTimeLocalToUtcIso(value) {
  if (!value) return null;

  // value 예: "2026-07-29T21:00"
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // 한국시간 UTC+9 이므로 UTC로 저장하려면 9시간 빼기
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));

  return utcDate.toISOString();
}

function getInitialCalendarDate(dateParam) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam || "")) return new Date();

  const date = new Date(`${dateParam}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default CalendarPage;
