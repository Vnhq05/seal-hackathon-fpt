import type { EventStatus } from "@/lib/api/types";

export type TransitionTargetStatus = Exclude<EventStatus, "CANCELLED">;

const TRANSITIONS: Record<EventStatus, TransitionTargetStatus[]> = {
  UPCOMING: ["OPEN", "CLOSED_REGISTRATION"],
  OPEN: ["CLOSED_REGISTRATION", "ACTIVE"],
  CLOSED_REGISTRATION: ["ACTIVE"],
  ACTIVE: ["SCORING", "COMPLETED"],
  SCORING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function allowedNextStatuses(current: EventStatus): TransitionTargetStatus[] {
  return TRANSITIONS[current] ?? [];
}

export const STATUS_ACTION_LABELS: Partial<Record<EventStatus, string>> = {
  OPEN: "Open Registration",
  CLOSED_REGISTRATION: "Close Registration",
  ACTIVE: "Start Competition",
  SCORING: "Start Scoring",
  COMPLETED: "Mark Completed",
};

export function statusActionLabel(target: TransitionTargetStatus): string {
  return STATUS_ACTION_LABELS[target] ?? target.replace(/_/g, " ");
}

export function isIrreversibleTransition(target: TransitionTargetStatus): boolean {
  return target === "CLOSED_REGISTRATION" || target === "SCORING" || target === "COMPLETED";
}

export const STATUS_DISPLAY_LABELS: Record<EventStatus, string> = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED_REGISTRATION: "Registration Closed",
  ACTIVE: "Active",
  SCORING: "Scoring",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
