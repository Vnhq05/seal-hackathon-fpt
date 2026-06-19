import Link from "next/link";
import type { DashboardHackathon, HackathonStatus } from "@/features/dashboard/types/dashboard.types";

const STATUS_CONFIG: Record<HackathonStatus, { bg: string; color: string; label: string }> = {
  upcoming: { bg: "#dbeafe", color: "#1d4ed8", label: "Upcoming" },
  active: { bg: "#dcfce7", color: "#15803d", label: "Active" },
  ended: { bg: "#eef0f6", color: "#2dd4bf", label: "Ended" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface HackathonItemProps {
  hackathon: DashboardHackathon;
}

export function HackathonItem({ hackathon }: HackathonItemProps) {
  const { bg, color, label } = STATUS_CONFIG[hackathon.status];

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
            style={{ fontSize: "11px", fontWeight: 600, backgroundColor: bg, color }}
          >
            {label}
          </span>
        </div>

        <div
          className="mt-1 flex flex-wrap items-center gap-3"
          style={{ fontSize: "12px", color: "rgba(101,217,243,0.2)" }}
        >
          <span>
            {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
          </span>
          {hackathon.trackName && (
            <>
              <span aria-hidden="true">·</span>
              <span>Track: {hackathon.trackName}</span>
            </>
          )}
          {hackathon.teamName && (
            <>
              <span aria-hidden="true">·</span>
              <span>Team: <strong style={{ color: "#8891a5" }}>{hackathon.teamName}</strong></span>
            </>
          )}
        </div>

        <p
          className="mt-1.5 line-clamp-2"
          style={{ fontSize: "13px", color: "#8891a5", lineHeight: "19px" }}
        >
          {hackathon.description}
        </p>
      </div>

      <Link
        href={`/participant/projects/${hackathon.id}`}
        className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-indigo-50"
        style={{ color: "#38bdf8", border: "1px solid #c4b5fd", whiteSpace: "nowrap" }}
      >
        View
      </Link>
    </div>
  );
}
