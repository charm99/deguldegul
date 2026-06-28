export const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateKeyFromValue(value) {
  return formatDateKey(new Date(value));
}

export function getCalendarDays(currentDate) {
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

export function toKoreanDate(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}월 ${String(date.getDate()).padStart(2, "0")}일 (${
    dayLabels[date.getDay()]
  })`;
}

export function formatTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getMeetingTypeLabel(value) {
  const map = {
    REG: "정기전",
    FLS: "번개",
    EVT: "이벤트",
  };

  return map[value] || value;
}

export function getStatusLabel(value) {
  const map = {
    OPN: "모집중",
    CLS: "마감",
    CNL: "취소",
  };

  return map[value] || value;
}

export function getAttendanceLabel(value) {
  const map = {
    ATD: "참석",
    LAT: "늦참",
    PND: "보류",
    ABS: "불참",
  };

  return map[value] || "미투표";
}