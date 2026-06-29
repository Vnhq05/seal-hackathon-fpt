import type { EventScheduleResponse, ScheduleGate, ScheduleType } from "@/lib/api/schedule.api";
import type { RoundResponse } from "@/lib/api/round.api";

export type ScheduleItemStatus = "upcoming" | "active" | "completed";

export function resolveScheduleStatus(
  item: EventScheduleResponse,
  now = Date.now(),
): ScheduleItemStatus {
  const start = new Date(item.startTime).getTime();
  const end = new Date(item.endTime).getTime();
  if (now < start) return "upcoming";
  if (now <= end) return "active";
  return "completed";
}

export function findActiveMilestone(
  schedules: EventScheduleResponse[] | undefined,
  now = Date.now(),
): EventScheduleResponse | undefined {
  return schedules?.find(
    (s) =>
      s.type === "MILESTONE" &&
      s.gate &&
      new Date(s.startTime).getTime() <= now &&
      new Date(s.endTime).getTime() >= now,
  );
}

export function findMilestones(schedules: EventScheduleResponse[]): EventScheduleResponse[] {
  return schedules.filter((s) => s.type === "MILESTONE");
}

export function findNextMilestone(
  schedules: EventScheduleResponse[],
  now = Date.now(),
): EventScheduleResponse | undefined {
  return findMilestones(schedules).find((s) => new Date(s.startTime).getTime() > now);
}

export function scheduleGateLabel(gate: ScheduleGate): string {
  switch (gate) {
    case "SLIDE_SUBMISSION":
      return "Slide gate (deadline 10:00)";
    case "DEMO_SUBMISSION":
      return "Demo gate (deadline 14:00)";
  }
}

export function scheduleTypeLabel(type: ScheduleType): string {
  switch (type) {
    case "WORKSHOP":
      return "Workshop";
    case "OPENING":
      return "Opening ceremony";
    case "TRACK_DRAW":
      return "Track draw";
    case "MILESTONE":
      return "Milestone";
    case "SCORING":
      return "Scoring";
    case "FINAL":
      return "Finals";
    case "CEREMONY":
      return "Award ceremony";
  }
}

export function scheduleStatusLabel(status: ScheduleItemStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "active":
      return "In progress";
    case "completed":
      return "Completed";
  }
}

export function groupSchedulesByDay(
  schedules: EventScheduleResponse[],
): { dateKey: string; dateLabel: string; items: EventScheduleResponse[] }[] {
  const sorted = [...schedules].sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
  const groups = new Map<string, EventScheduleResponse[]>();

  for (const item of sorted) {
    const dateKey = item.startTime.slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(item);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    dateLabel: new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    items,
  }));
}

export function getGateDeadlineFromRound(
  gate: ScheduleGate | null,
  round: RoundResponse | undefined,
): string | null {
  if (!gate || !round) return null;
  if (gate === "SLIDE_SUBMISSION") return round.slideDeadline ?? null;
  if (gate === "DEMO_SUBMISSION") return round.submissionDeadline ?? null;
  return null;
}

export function sortSchedules(schedules: EventScheduleResponse[]): EventScheduleResponse[] {
  return [...schedules].sort((a, b) => a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
}
