const DATE_TIME_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

export function formatDate(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", options);
}

export function formatDateTime(value, options = {}) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    ...DATE_TIME_OPTIONS,
    ...options,
  });
}

export function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function koreanDateTimeLocalToUtcIso(value) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute)).toISOString();
}
