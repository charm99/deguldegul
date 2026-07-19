import { useEffect, useMemo, useState } from "react";

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

import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

import EmptyState from "./components/EmptyState";
import FlashMeetingDialog from "./components/FlashMeetingDialog";
import Legend from "./components/Legend";
import MeetingCard from "./components/MeetingCard";
import ScoreDialog from "./components/ScoreDialog";
import ScoreMeetingCard from "./components/ScoreMeetingCard";
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

function CalendarPage() {
  const { profile } = useAuth();

  const [tab, setTab] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));

  const [meetings, setMeetings] = useState([]);
  const [centers, setCenters] = useState([]);
  const [scores, setScores] = useState([]);
  const [myAttendances, setMyAttendances] = useState([]);
  const [battleEntries, setBattleEntries] = useState([]);
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

  const monthTitle = `${currentDate.getFullYear()}년 ${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}월`;

  const selectedMeetings = meetings.filter(
    (meeting) => getDateKeyFromValue(meeting.meeting_dt) === selectedDate
  );

  const scoreTargetMeetings = selectedMeetings.filter((meeting) =>
    myAttendances.some(
      (attendance) =>
        attendance.meeting_id === meeting.meeting_id &&
        ["ATD", "LAT"].includes(attendance.attendance_tp)
    )
  );

  const loadCenters = async () => {
    const { data, error } = await supabase
      .from("degul_center")
      .select("center_id, center_nm")
      .eq("use_yn", "Y")
      .order("center_nm");

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
        created_by,
        center:center_id (
          center_nm,
          address,
          bank_nm,
          account_no,
          account_holder,
          game_cost
        )
      `)
      .eq("use_yn", "Y")
      .neq("status", "CNL")
      .gte("meeting_dt", monthStart.toISOString())
      .lt("meeting_dt", monthEnd.toISOString())
      .order("meeting_dt", { ascending: true })
      .order("status", { ascending: false });

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

    const { data, error } = await supabase
      .from("degul_score")
      .select("*")
      .eq("user_id", profile.id)
      .in("meeting_id", meetingIds)
      .order("game_no", { ascending: true });

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

    const { data, error } = await supabase
      .from("degul_attendance")
      .select("*")
      .eq("user_id", profile.id)
      .in("meeting_id", meetingIds);

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

    const { data, error } = await supabase
      .from("degul_attendance")
      .select(`
        meeting_id,
        user_id,
        battle_join_yn,
        user:user_id (
          id,
          name,
          nickname
        )
      `)
      .eq("battle_join_yn", "Y")
      .in("meeting_id", meetingIds);

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

  const openScoreDialog = (meeting) => {
    setSelectedMeeting(meeting);

    const savedScores = scores
      .filter((score) => score.meeting_id === meeting.meeting_id)
      .sort((a, b) => a.game_no - b.game_no);

    if (savedScores.length > 0) {
      setScoreInputs(
        savedScores.map((item) => ({
          game_no: item.game_no,
          score: String(item.score),
        }))
      );
    } else {
      const defaultGameCount = 4;

      setScoreInputs(
        Array.from({ length: defaultGameCount }, (_, index) => ({
          game_no: index + 1,
          score: "",
        }))
      );
    }

    setScoreDialogOpen(true);
  };

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

    const { error } = await supabase
      .from("degul_attendance")
      .upsert(payload, {
        onConflict: "meeting_id,user_id",
      });

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

    const { error } = await supabase.from("degul_meeting").insert({
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

    const { error: updateError } = await supabase
      .from("degul_meeting")
      .update({
        status: "CLS",
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meeting.meeting_id)
      .eq("created_by", profile.id)
      .eq("meeting_tp", "FLS");

    if (updateError) {
      alert(updateError.message);
      return;
    }

    const { error: battleError } = await supabase.rpc("generate_battle_matches", {
      p_meeting_id: meeting.meeting_id,
    });

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

    const { error } = await supabase
      .from("degul_meeting")
      .update({
        use_yn: "N",
        status: "CNL",
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meeting.meeting_id)
      .eq("meeting_tp", "FLS")
      .eq("created_by", profile.id)
      .eq("status", "OPN");

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

    const { error: deleteError } = await supabase
      .from("degul_score")
      .delete()
      .eq("meeting_id", selectedMeeting.meeting_id)
      .eq("user_id", profile.id);

    if (deleteError) {
      alert(deleteError.message);
      return;
    }

    if (validScores.length > 0) {
      const { error: insertError } = await supabase
        .from("degul_score")
        .insert(validScores);

      if (insertError) {
        alert(insertError.message);
        return;
      }
    }

    setScoreDialogOpen(false);
    await loadScores();
  };

  const deleteScores = async () => {
    if (!selectedMeeting || !profile?.id) return;

    if (!confirm("해당 모임의 내 점수를 모두 삭제할까요?")) return;

    const { error } = await supabase
      .from("degul_score")
      .delete()
      .eq("meeting_id", selectedMeeting.meeting_id)
      .eq("user_id", profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    setScoreDialogOpen(false);
    await loadScores();
  };

  const renderSelectedContent = () => {
    if (tab === 0) {
      return (
        <Stack spacing={2}>
          <Typography fontWeight={800}>
            {toKoreanDate(selectedDate)} 스코어
          </Typography>

          {scoreTargetMeetings.length === 0 ? (
            <EmptyState text="참석한 모임이 없습니다." />
          ) : (
            scoreTargetMeetings.map((meeting) => {
              const myScores = scores
                .filter((score) => score.meeting_id === meeting.meeting_id)
                .sort((a, b) => a.game_no - b.game_no);

              return (
                <ScoreMeetingCard
                  key={meeting.meeting_id}
                  meeting={meeting}
                  scores={myScores}
                  onClick={() => openScoreDialog(meeting)}
                />
              );
            })
          )}
        </Stack>
      );
    }
    const openBattleDialog = async (meeting) => {
      if (meeting.status !== "CLS") {
        alert("모임이 마감된 후 확인 가능합니다.");
        return;
      }

      setBattleMeeting(meeting);

      const { data, error } = await supabase
        .from("degul_battle_history")
        .select(`
          battle_id,
          meeting_id,
          game_no,
          bye_yn,
          result_status,
          result_confirm_yn,
          winner_user_id,
          loser_user_id,
          user1:user1_id (
            id,
            name,
            nickname
          ),
          user2:user2_id (
            id,
            name,
            nickname
          )
        `)
        .eq("meeting_id", meeting.meeting_id)
        .order("game_no", { ascending: true });

      if (error) {
        alert(error.message);
        return;
      }

      setBattleMatches(data || []);
      setBattleDialogOpen(true);
    };
    const openAttendanceListDialog = async (meeting) => {
      setAttendanceMeeting(meeting);

      const { data, error } = await supabase
        .from("degul_attendance")
        .select(`
          meeting_id,
          user_id,
          attendance_tp,
          battle_join_yn,
          memo,
          updated_at,
          user:user_id (
            id,
            name,
            nickname
          )
        `)
        .eq("meeting_id", meeting.meeting_id)
        .order("attendance_tp", { ascending: true })
        .order("updated_at", { ascending: true });

      if (error) {
        alert(error.message);
        return;
      }

      setAttendanceList(data || []);
      setAttendanceDialogOpen(true);
    };

    if (tab === 2) {
      return <EmptyState text="이벤트 기능은 추후 구현 예정입니다." />;
    }

    return (
      <Stack spacing={2}>
        <Typography fontWeight={800}>
          {toKoreanDate(selectedDate)} 모임 일정
        </Typography>

        {selectedMeetings.length === 0 ? (
          <EmptyState text="선택한 날짜에 등록된 모임이 없습니다." />
        ) : (
          selectedMeetings.map((meeting) => {
            const myAttendance = myAttendances.find(
              (attendance) => attendance.meeting_id === meeting.meeting_id
            );

            return (
              <MeetingCard
                key={meeting.meeting_id}
                meeting={meeting}
                attendance={myAttendance}
                profile={profile}
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
    <Box sx={{ p: 2, position: "relative", minHeight: "calc(100vh - 80px)" }}>
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
        캘린더
      </Typography>

      <Box sx={{ position: "sticky", top: 0, zIndex: 1100, bgcolor: "background.default", mx: -2, px: 2}}>
        <Tabs
          value={tab}
          onChange={(e, value) => setTab(value)}
          variant="fullWidth"
          sx={{ mb: 2, "& .MuiTab-root": { fontWeight: 700 } }}
        >
          <Tab label="스코어" />
          <Tab label="모임" />
          <Tab label="이벤트" />
        </Tabs>
      </Box>  
      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <IconButton onClick={() => moveMonth(-1)}>
          <ChevronLeftIcon />
        </IconButton>

        <Typography fontWeight={800} fontSize={20}>
          {monthTitle}
        </Typography>

        <IconButton onClick={() => moveMonth(1)}>
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {WEEK_LABELS.map((label, index) => (
          <Typography
            key={label}
            textAlign="center"
            fontWeight={800}
            color={
              index === 0
                ? "error.main"
                : index === 6
                ? "primary.main"
                : "text.primary"
            }
            sx={{ py: 1 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          rowGap: 1.1,
          mb: 2.5,
        }}
      >
        {calendarDays.map((item) => {
          const dateKey = formatDateKey(item.date);
          const isSelected = selectedDate === dateKey;
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
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isSelected ? "primary.main" : "transparent",
                  color: isSelected
                    ? "#fff"
                    : !item.currentMonth
                    ? "text.disabled"
                    : dayOfWeek === 0
                    ? "error.main"
                    : dayOfWeek === 6
                    ? "primary.main"
                    : "text.primary",
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 18,
                }}
              >
                {item.day}
              </Box>

              <Stack
                direction="row"
                spacing={0.3}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                {marks.map((mark) => (
                  <Box
                    key={mark}
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      bgcolor: mark === "score" ? "#43a047" : "#1976d2",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 2, px: 0.5 }}>
        <Legend color="#1976d2" label="모임" />
        <Legend color="#43a047" label="점수입력" />
      </Stack>

      {renderSelectedContent()}

      {tab === 1 && (
        <Fab
          color="primary"
          onClick={openFlashDialog}
          sx={{
            position: "fixed",
            bottom: "calc(88px + env(safe-area-inset-bottom))",
            right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
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
        onClose={() => setScoreDialogOpen(false)}
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

export default CalendarPage;
