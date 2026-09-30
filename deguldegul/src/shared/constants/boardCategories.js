export const BOARD_CATEGORIES = Object.freeze([
  { value: "GEN", label: "일반" },
  { value: "SLP", label: "휴면신청" },
  { value: "USED", label: "중고거래" },
]);

export function getBoardCategoryLabel(value) {
  return BOARD_CATEGORIES.find((item) => item.value === value)?.label || "일반";
}
