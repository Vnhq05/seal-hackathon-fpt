import type { ContestedSlotType, FinalistSelectionMethod } from "./finalist.api";

const SELECTION_METHOD_LABELS: Record<FinalistSelectionMethod, string> = {
  TOP_PER_TRACK: "Top per track",
  OVERFLOW_FILL: "Finals slot overflow fill",
  PENALTY_PENDING: "Pending OC penalty review",
};

const CONTESTED_SLOT_LABELS: Record<ContestedSlotType, string> = {
  PER_TRACK_CUTOFF: "Tie at Top-N within track",
  OVERFLOW_FILL: "Tie when filling finals slots",
};

export function formatSelectionMethod(method: FinalistSelectionMethod | null | undefined): string {
  if (!method) return "—";
  return SELECTION_METHOD_LABELS[method] ?? method;
}

export function formatContestedSlotType(slotType: ContestedSlotType): string {
  return CONTESTED_SLOT_LABELS[slotType] ?? slotType;
}
