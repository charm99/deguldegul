export const KOREA_TIME_ZONE = "Asia/Seoul";

const DATE_TIME_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

export function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    ...options,
  });
}

export function formatDateTime(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    ...DATE_TIME_OPTIONS,
    ...options,
  });
}

export function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  return `${year}-${month}-${day}`;
}

export function koreanDateTimeLocalToUtcIso(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute)).toISOString();
}
