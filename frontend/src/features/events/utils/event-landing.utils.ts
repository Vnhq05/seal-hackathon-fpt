import type { EventResponse } from "@/lib/api/event.api";
import type { EventStatus } from "@/lib/api/types";

export function formatEventDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

export function formatEventDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_META: Record<
  EventStatus,
  { label: string; className: string; glow: string }
> = {
  OPEN: {
    label: "Registration Open",
    className: "bg-seal-mint/15 text-seal-mint border-seal-mint/30",
    glow: "shadow-seal-mint/20",
  },
  CLOSED_REGISTRATION: {
    label: "Registration Closed",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    glow: "",
  },
  ACTIVE: {
    label: "Live Now",
    className: "bg-seal-cyan/15 text-seal-cyan border-seal-cyan/30",
    glow: "shadow-seal-cyan/20",
  },
  SCORING: {
    label: "Scoring",
    className: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    glow: "",
  },
  UPCOMING: {
    label: "Coming Soon",
    className: "bg-royal/15 text-royal border-royal/30",
    glow: "shadow-seal-purple/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-seal-text-secondary/10 text-seal-text-secondary border-seal-border",
    glow: "",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-seal-error/10 text-seal-error border-seal-error/30",
    glow: "",
  },
};

export function getStatusMeta(status: EventStatus) {
  return STATUS_META[status] ?? STATUS_META.UPCOMING;
}

export function formatTeamSize(event: EventResponse): string {
  if (event.minTeam != null && event.maxTeam != null) {
    return `${event.minTeam}–${event.maxTeam} members`;
  }
  if (event.minTeam != null) return `Min ${event.minTeam} members`;
  if (event.maxTeam != null) return `Up to ${event.maxTeam} members`;
  return "Flexible team size";
}

export function formatSemesterRange(event: EventResponse): string | null {
  if (event.semesterMin == null && event.semesterMax == null) return null;
  if (event.semesterMin != null && event.semesterMax != null) {
    return `Semester ${event.semesterMin}–${event.semesterMax}`;
  }
  if (event.semesterMin != null) return `Semester ${event.semesterMin}+`;
  return `Up to semester ${event.semesterMax}`;
}

export function formatFormatLabel(format: string): string {
  const map: Record<string, string> = {
    OFFLINE: "On-site",
    ONLINE: "Online",
    HYBRID: "Hybrid",
  };
  return map[format] ?? format;
}

export function calcTotalPrizePool(prizes: EventResponse["prizes"]): number {
  return prizes.reduce((sum, prize) => {
    const digits = prize.value.replace(/[^\d]/g, "");
    const amount = digits ? parseInt(digits, 10) : 0;
    return sum + amount * prize.quantity;
  }, 0);
}
