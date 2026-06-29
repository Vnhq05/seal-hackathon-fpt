import type { ContestedSlotType, FinalistSelectionMethod } from "./finalist.api";

const SELECTION_METHOD_LABELS: Record<FinalistSelectionMethod, string> = {
  TOP_PER_TRACK: "Top trong bảng",
  OVERFLOW_FILL: "Bổ sung slot chung kết",
  PENALTY_PENDING: "Chờ OC đánh giá penalty",
};

const CONTESTED_SLOT_LABELS: Record<ContestedSlotType, string> = {
  PER_TRACK_CUTOFF: "Hòa điểm tại Top-N trong bảng",
  OVERFLOW_FILL: "Hòa điểm khi bổ sung slot chung kết",
};

export function formatSelectionMethod(method: FinalistSelectionMethod | null | undefined): string {
  if (!method) return "—";
  return SELECTION_METHOD_LABELS[method] ?? method;
}

export function formatContestedSlotType(slotType: ContestedSlotType): string {
  return CONTESTED_SLOT_LABELS[slotType] ?? slotType;
}
