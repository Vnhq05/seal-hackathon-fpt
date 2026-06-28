import Link from "next/link";
import type { EventResponse, EventStatus } from "@/lib/api";

const STATUS_CONFIG: Record<EventStatus, { bg: string; color: string; label: string }> = {
  UPCOMING:  { bg: "#f0f9ff", color: "#0369a1", label: "Upcoming" },
  OPEN:      { bg: "#e0f2fe", color: "#0284c7", label: "Open" },
  CLOSED_REGISTRATION: { bg: "#fef3c7", color: "#b45309", label: "Registration Closed" },
  ACTIVE:    { bg: "#dcfce7", color: "#15803d", label: "Active" },
  SCORING:   { bg: "#ede9fe", color: "#6d28d9", label: "Scoring" },
  COMPLETED: { bg: "#eef0f6", color: "#2dd4bf", label: "Completed" },
  CANCELLED: { bg: "#fef9c3", color: "#a16207", label: "Cancelled" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface HackathonItemProps {
  hackathon: EventResponse;
}

export function HackathonItem({ hackathon }: HackathonItemProps) {
  const cfg = STATUS_CONFIG[hackathon.status] ?? {
    bg: "#eef0f6",
    color: "#8891a5",
    label: hackathon.status,
  };

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-lg bg-seal-surface p-4"
      style={{ border: "1px solid rgba(223,226,236,0.8)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className="truncate font-semibold"
            style={{ fontSize: "15px", color: "#0e1528" }}
          >
            {hackathon.name}
          </h3>
          <span
            className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5"
            style={{ fontSize: "11px", fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>

        <div
          className="mt-1 flex flex-wrap items-center gap-3"
          style={{ fontSize: "12px", color: "#8891a5" }}
        >
          <span>
            {formatDate(hackathon.startDate)} &ndash; {formatDate(hackathon.endDate)}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span>
            {hackathon.season} {hackathon.year}
          </span>
        </div>
      </div>

      <Link
        href={`/student/projects/${hackathon.id}`}
        className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-indigo-50"
        style={{ color: "#38bdf8", border: "1px solid #c4b5fd", whiteSpace: "nowrap" }}
      >
        View
      </Link>
    </div>
  );
}
