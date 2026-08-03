export function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || value === "-") return "-";
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return digits > 0 ? number.toFixed(digits) : number.toLocaleString("ko-KR");
}

export function formatPoints(value, { signed = false } = {}) {
  const number = Number(value || 0);
  const prefix = signed && number > 0 ? "+" : "";
  return `${prefix}${number.toLocaleString("ko-KR")}P`;
}
