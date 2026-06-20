"use client";

import Link from "next/link";
import type { EventResponse } from "@/lib/api";
import {
  CalendarIcon,
  ClockIcon,
} from "@/features/events/components/hackathon-icons";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "rgba(16, 185, 129, 0.9)",
  DRAFT: "rgba(245, 158, 11, 0.9)",
  COMPLETED: "#8891a5",
  CANCELLED: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const month = s.toLocaleString("en-US", { month: "short" });
  return `${month} ${String(s.getDate()).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}

function getClosingText(deadline: string): string {
  const days = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / 86_400_000,
  );
  if (days <= 0) return "Registration closed";
  return `Registration closes in ${days}d`;
}

function OutlineButton({ label }: { label: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{
        border: "1px solid rgba(223,226,236,0.8)",
        padding: "9px 17px",
        ...metaStyle,
        color: "#0e1528",
      }}
    >
      {label}
    </span>
  );
}

function CardFooter({ event }: { event: EventResponse }) {
  const footerBorder: React.CSSProperties = {
    borderTop: "1px solid rgba(198, 198, 205, 0.3)",
  };

  if (event.status === "ACTIVE") {
    return (
      <div
        className="flex items-center justify-between pt-4"
        style={footerBorder}
      >
        <div className="flex items-center gap-1">
          <ClockIcon />
          <span style={metaStyle}>
            {getClosingText(event.registrationDeadline)}
          </span>
        </div>
        <span
          className="flex shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: "#059669",
            padding: "8px 16px",
            ...metaStyle,
            color: "#ffffff",
            boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          View details
        </span>
      </div>
    );
  }

  if (event.status === "DRAFT") {
    return (
      <div
        className="flex items-center justify-end pt-4"
        style={footerBorder}
      >
        <OutlineButton label="Coming soon" />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-end pt-4"
      style={footerBorder}
    >
      <OutlineButton label="View results" />
    </div>
  );
}

interface HackathonCardProps {
  hackathon: EventResponse;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const isEnded =
    hackathon.status === "COMPLETED" || hackathon.status === "CANCELLED";

  return (
    <Link
      href={`/participant/projects/${hackathon.id}`}
      className="flex flex-col overflow-hidden rounded-lg transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(198, 198, 205, 0.5)",
        opacity: isEnded ? 0.8 : 1,
        boxShadow:
          hackathon.status === "ACTIVE"
            ? "0px 0px 0px 1px rgba(99, 102, 241, 0.2)"
            : undefined,
      }}
    >
      {/* Banner placeholder -- EventResponse does not include bannerUrl */}
      <div
        className="relative h-32 w-full overflow-hidden"
        style={{ backgroundColor: "rgba(223,226,236,0.8)" }}
      >
        {isEnded && (
          <div
            className="pointer-events-none absolute inset-0 bg-seal-surface/50"
            style={{ mixBlendMode: "saturation" }}
          />
        )}
        <div
          className="absolute right-2 top-2 flex items-center gap-1 rounded px-2 py-1"
          style={{
            backgroundColor:
              STATUS_COLORS[hackathon.status] ?? "#8891a5",
            backdropFilter: "blur(2px)",
          }}
        >
          {hackathon.status === "ACTIVE" && (
            <span
              className="block rounded-full"
              style={{ width: 6, height: 6, backgroundColor: "#fff" }}
            />
          )}
          <span style={{ ...metaStyle, color: "#ffffff" }}>
            {STATUS_LABELS[hackathon.status] ?? hackathon.status}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-6">
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#0e1528",
            lineHeight: "25.2px",
            marginBottom: 4,
          }}
        >
          {hackathon.name}
        </h3>
        <p
          className="line-clamp-2"
          style={{
            fontSize: 14,
            color: "#8891a5",
            lineHeight: "20px",
            marginBottom: 16,
          }}
        >
          {hackathon.season} {hackathon.year}
        </p>
        <div
          className="flex items-center gap-4"
          style={{ marginBottom: 16 }}
        >
          <span className="flex items-center gap-1">
            <CalendarIcon />
            <span style={metaStyle}>
              {formatDateRange(hackathon.startDate, hackathon.endDate)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span style={metaStyle}>
              {hackathon.roundCount} round{hackathon.roundCount !== 1 ? "s" : ""}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span style={metaStyle}>
              {hackathon.mentorCount} mentor{hackathon.mentorCount !== 1 ? "s" : ""}
            </span>
          </span>
        </div>
        <CardFooter event={hackathon} />
      </div>
    </Link>
  );
}
