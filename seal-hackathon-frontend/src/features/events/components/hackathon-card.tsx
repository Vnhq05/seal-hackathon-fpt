"use client";

import Link from "next/link";
import type { HackathonListItem } from "@/features/events/types/hackathon.types";
import {
  CalendarIcon,
  UsersIcon,
  TagIcon,
  ClockIcon,
  TrophySmallIcon,
} from "@/features/events/components/hackathon-icons";

const STATUS_COLORS: Record<string, string> = {
  ongoing: "rgba(99, 102, 241, 0.9)",
  open: "rgba(16, 185, 129, 0.9)",
  upcoming: "rgba(245, 158, 11, 0.9)",
  ended: "#8891a5",
};

const STATUS_LABELS: Record<string, string> = {
  ongoing: "Ongoing",
  open: "Open for Registration",
  upcoming: "Upcoming",
  ended: "Ended",
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

function formatParticipants(count: number | null, status: string): string {
  if (count === null) return "TBA";
  if (status === "open") return `${count} Reg`;
  return `${count}+`;
}

function getClosingText(closesAt: string | null): string {
  if (!closesAt) return "";
  const days = Math.ceil((new Date(closesAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Closing soon";
  return `Closes in ${days}d`;
}

function OutlineButton({ label }: { label: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{ border: "1px solid rgba(223,226,236,0.8)", padding: "9px 17px", ...metaStyle, color: "#0e1528" }}
    >
      {label}
    </span>
  );
}

function CardFooter({ hackathon }: { hackathon: HackathonListItem }) {
  const footerBorder: React.CSSProperties = { borderTop: "1px solid rgba(198, 198, 205, 0.3)" };

  if (hackathon.status === "ongoing" && hackathon.currentRound) {
    const { current, total, progressPercent } = hackathon.currentRound;
    return (
      <div className="flex items-center gap-4 pt-4" style={footerBorder}>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span style={metaStyle}>Round {current} of {total}</span>
            <span style={metaStyle}>{progressPercent}%</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(223,226,236,0.8)" }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ backgroundColor: "#3b82f6", width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <OutlineButton label="View details" />
      </div>
    );
  }

  if (hackathon.status === "open") {
    return (
      <div className="flex items-center justify-between pt-4" style={footerBorder}>
        <div className="flex items-center gap-1">
          <ClockIcon />
          <span style={metaStyle}>{getClosingText(hackathon.registrationClosesAt)}</span>
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
          Register now
        </span>
      </div>
    );
  }

  if (hackathon.status === "upcoming") {
    return (
      <div className="flex items-center justify-end pt-4" style={footerBorder}>
        <OutlineButton label="Notify me" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between pt-4" style={footerBorder}>
      <div className="flex items-center gap-1">
        <TrophySmallIcon />
        <span style={metaStyle}>{hackathon.winnersCount ?? 0} Winners Announced</span>
      </div>
      <OutlineButton label="View results" />
    </div>
  );
}

interface HackathonCardProps {
  hackathon: HackathonListItem;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const isEnded = hackathon.status === "ended";
  const isOpen = hackathon.status === "open";

  return (
    <Link
      href={`/participant/projects/${hackathon.id}`}
      className="flex flex-col overflow-hidden rounded-lg transition-shadow hover:shadow-md"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(198, 198, 205, 0.5)",
        opacity: isEnded ? 0.8 : 1,
        boxShadow: isOpen ? "0px 0px 0px 1px rgba(99, 102, 241, 0.2)" : undefined,
      }}
    >
      <div className="relative h-32 w-full overflow-hidden" style={{ backgroundColor: "rgba(223,226,236,0.8)" }}>
        {hackathon.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hackathon.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {isEnded && (
          <div className="pointer-events-none absolute inset-0 bg-seal-surface/50" style={{ mixBlendMode: "saturation" }} />
        )}
        <div
          className="absolute right-2 top-2 flex items-center gap-1 rounded px-2 py-1"
          style={{ backgroundColor: STATUS_COLORS[hackathon.status], backdropFilter: "blur(2px)" }}
        >
          {hackathon.status === "ongoing" && (
            <span className="block rounded-full" style={{ width: 6, height: 6, backgroundColor: "#fff" }} />
          )}
          <span style={{ ...metaStyle, color: "#ffffff" }}>{STATUS_LABELS[hackathon.status]}</span>
        </div>
      </div>

      <div className="flex flex-col p-6">
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px", marginBottom: 4 }}>
          {hackathon.name}
        </h3>
        <p className="line-clamp-2" style={{ fontSize: 14, color: "#8891a5", lineHeight: "20px", marginBottom: 16 }}>
          {hackathon.description}
        </p>
        <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
          <span className="flex items-center gap-1">
            <CalendarIcon />
            <span style={metaStyle}>{formatDateRange(hackathon.startDate, hackathon.endDate)}</span>
          </span>
          <span className="flex items-center gap-1">
            <UsersIcon />
            <span style={metaStyle}>{formatParticipants(hackathon.participantCount, hackathon.status)}</span>
          </span>
          <span className="flex items-center gap-1">
            <TagIcon />
            <span style={metaStyle}>{hackathon.category}</span>
          </span>
        </div>
        <CardFooter hackathon={hackathon} />
      </div>
    </Link>
  );
}
