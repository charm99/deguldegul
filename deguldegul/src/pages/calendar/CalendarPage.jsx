import { useMemo, useState } from "react";

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  IconButton,
  Fab,
  Divider,
  Chip,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const scoreData = [
  {
    date: "2026-06-21",
    scores: [213, 187, 162],
    center: "볼원 볼링장",
  },
  {
    date: "2026-06-28",
    scores: [179, 201],
    center: "레인보우볼링장",
  },
];

const meetingData = [
  {
    date: "2026-06-21",
    time: "19:00",
    title: "정기전",
    center: "볼원 볼링장",
    attend: "12/20",
    type: "REGULAR",
  },
  {
    date: "2026-06-28",
    time: "19:00",
    title: "번개모임",
    center: "레인보우볼링장",
    attend: "6/10",
    type: "FLASH",
  },
  {
    date: "2026-07-05",
    time: "19:00",
    title: "정기전",
    center: "양산킴스볼링센터",
    attend: "14/20",
    type: "REGULAR",
  },
];

const eventData = [
  {
    date: "2026-06-24",
    title: "렌보 벙",
    center: "레인보우볼링장",
  },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  const startDay = firstDate.getDay();
  const lastDay = lastDate.getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const days = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevLastDate - i;
    days.push({
      date: new Date(year, month - 1, day),
      day,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= lastDay; day++) {
    days.push({
      date: new Date(year, month, day),
      day,
      currentMonth: true,
    });
  }

  const nextDays = 35 - days.length;

  for (let day = 1; day <= nextDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      day,
      currentMonth: false,
    });
  }

  return days;
}

function CalendarPage() {
  const [tab, setTab] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 21));
  const [selectedDate, setSelectedDate] = useState("2026-06-21");

  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  const monthTitle = `${currentDate.getFullYear()}년 ${String(
    currentDate.getMonth() + 1
  ).padStart(2, "0")}월`;

  const selectedScore = scoreData.find((item) => item.date === selectedDate);

  const selectedMeetings = meetingData.filter(
    (item) => item.date === selectedDate
  );

  const selectedEvents = eventData.filter((item) => item.date === selectedDate);

  const upcomingMeetings = meetingData.filter((item) => item.date !== selectedDate);

  const moveMonth = (amount) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1)
    );
  };

  const getDayMarks = (dateKey) => {
    const marks = [];

    if (scoreData.some((item) => item.date === dateKey)) {
      marks.push("score");
    }

    if (meetingData.some((item) => item.date === dateKey)) {
      marks.push("meeting");
    }

    if (eventData.some((item) => item.date === dateKey)) {
      marks.push("event");
    }

    return marks;
  };

  const renderSelectedContent = () => {
    if (tab === 0) {
      if (!selectedScore) {
        return <EmptyState text="선택한 날짜에 등록된 점수가 없습니다." />;
      }

      const total = selectedScore.scores.reduce((sum, score) => sum + score, 0);
      const avg = (total / selectedScore.scores.length).toFixed(1);
      const max = Math.max(...selectedScore.scores);

      return (
        <Stack spacing={2}>
          <Card sx={cardSx}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={800}>{toKoreanDate(selectedDate)}</Typography>
                <Typography color="text.secondary">{selectedScore.center}</Typography>
              </Stack>

              <Stack direction="row" sx={{ mt: 2 }}>
                <InfoBox label="게임 수" value={`${selectedScore.scores.length}게임`} />
                <InfoBox label="평균 점수" value={avg} />
                <InfoBox label="최고 점수" value={max} />
                <InfoBox label="누적 점수" value={total} />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={cardSx}>
            <CardContent>
              <Typography fontWeight={800} sx={{ mb: 1 }}>
                게임별 점수
              </Typography>

              {selectedScore.scores.map((score, index) => (
                <Box key={index}>
                  <Stack direction="row" justifyContent="space-between" py={1.2}>
                    <Typography color="text.secondary">{index + 1}게임</Typography>
                    <Typography fontWeight={700}>{score}점</Typography>
                  </Stack>
                  {index < selectedScore.scores.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Stack>
      );
    }

    if (tab === 1) {
      return (
        <Stack spacing={2}>
          <Typography fontWeight={800}>{toKoreanDate(selectedDate)} 모임 일정</Typography>

          {selectedMeetings.length === 0 ? (
            <EmptyState text="선택한 날짜에 등록된 모임이 없습니다." />
          ) : (
            selectedMeetings.map((item, index) => (
              <MeetingCard key={index} item={item} selected />
            ))
          )}

          <Typography fontWeight={800} sx={{ mt: 1 }}>
            다가오는 모임
          </Typography>

          {upcomingMeetings.map((item, index) => (
            <MeetingCard key={index} item={item} />
          ))}
        </Stack>
      );
    }

    if (selectedEvents.length === 0) {
      return <EmptyState text="선택한 날짜에 등록된 이벤트가 없습니다." />;
    }

    return (
      <Stack spacing={2}>
        {selectedEvents.map((item, index) => (
          <Card key={index} sx={cardSx}>
            <CardContent>
              <Typography fontWeight={800}>{item.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {item.center}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ p: 2, position: "relative", minHeight: "calc(100vh - 80px)" }}>
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
        캘린더
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="fullWidth"
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            fontWeight: 700,
          },
        }}
      >
        <Tab label="스코어" />
        <Tab label="모임" />
        <Tab label="이벤트" />
      </Tabs>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mb: 1,
        }}
      >
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
                      bgcolor:
                        mark === "score"
                          ? "#43a047"
                          : mark === "meeting"
                          ? "#1976d2"
                          : "#fb8c00",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {tab === 1 && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, px: 0.5 }}>
          <Legend color="#1976d2" label="정기전" />
          <Legend color="#fb8c00" label="번개모임" />
          <Legend color="#bdbdbd" label="기타" />
        </Stack>
      )}

      {renderSelectedContent()}

      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: "calc(88px + env(safe-area-inset-bottom))",
          right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
          zIndex: 1200,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

function MeetingCard({ item, selected = false }) {
  const isRegular = item.type === "REGULAR";

  return (
    <Card sx={cardSx}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography
            fontWeight={800}
            color={isRegular ? "primary.main" : "warning.main"}
          >
            {item.time}
          </Typography>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={800}>{item.title}</Typography>

              {selected && (
                <Chip
                  label="참석"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {item.center}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            참석 {item.attend}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        textAlign: "center",
        borderRight: "1px solid #eee",
        "&:last-of-type": {
          borderRight: "none",
        },
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Legend({ color, label }) {
  return (
    <Stack direction="row" spacing={0.7} alignItems="center">
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: color,
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

function EmptyState({ text }) {
  return (
    <Box
      sx={{
        py: 5,
        textAlign: "center",
        color: "text.secondary",
      }}
    >
      <Typography>{text}</Typography>
    </Box>
  );
}

function toKoreanDate(dateText) {
  const date = new Date(dateText);
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}월 ${String(date.getDate()).padStart(2, "0")}일 (${
    dayLabels[date.getDay()]
  })`;
}

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

export default CalendarPage;