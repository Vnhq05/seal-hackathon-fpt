"use client";

import type { MentorTeamDetail } from "@/features/mentor/types/mentor.types";

const STATUS_STYLE: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
  active: { bg: "rgba(209,250,229,0.5)", border: "#a7f3d0", dot: "#10b981", text: "#065f46", label: "Active" },
  inactive: { bg: "#eef0f6", border: "rgba(64,145,108,0.25)", dot: "#2dd4bf", text: "#2dd4bf", label: "Inactive" },
  disqualified: { bg: "#fef2f2", border: "#fecaca", dot: "#dc2626", text: "#dc2626", label: "Disqualified" },
};

function TrackIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" rx="2" stroke="#0e1528" strokeWidth="1" />
      <path d="M3 5.5h5M5.5 3v5" stroke="#0e1528" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg width="15" height="12" viewBox="0 0 15 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="13" height="10" rx="2" stroke="#38bdf8" strokeWidth="1.2" />
      <path d="M1 3l6.5 4L14 3" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  team: MentorTeamDetail;
}

export function MentorTeamDetailHeader({ team }: Props) {
  const status = STATUS_STYLE[team.status] ?? STATUS_STYLE.active;

  return (
    <div
      className="flex items-start justify-between overflow-hidden rounded-lg"
      style={{ backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)", padding: 25, position: "relative" }}
    >
      <div
        style={{ position: "absolute", top: -128, right: -85, width: 256, height: 256, borderRadius: 9999, backgroundColor: "#dcfce7", filter: "blur(32px)", opacity: 0.2 }}
      />
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            {team.name}
          </h1>
          <span
            className="flex items-center gap-1 rounded-full"
            style={{ backgroundColor: "#dcfce7", border: "1px solid rgba(223,226,236,0.8)", padding: "5px 9px", fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px" }}
          >
            <TrackIcon />
            {team.trackName}
          </span>
          <span
            className="flex items-center gap-1 rounded-full"
            style={{ backgroundColor: status.bg, border: `1px solid ${status.border}`, padding: "5px 9px", fontSize: 12, fontWeight: 500, color: status.text, letterSpacing: "0.24px" }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: status.dot, flexShrink: 0 }} />
            {status.label}
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", maxWidth: 672 }}>
          {team.description}
        </p>
      </div>
      <button
        type="button"
        className="relative flex items-center gap-1"
        style={{ backgroundColor: "#eef0f6", border: "1px solid #38bdf8", padding: "9px 17px", fontSize: 12, fontWeight: 500, color: "#38bdf8", letterSpacing: "0.24px", lineHeight: "12px", cursor: "pointer" }}
      >
        <ContactIcon />
        Contact team
      </button>
    </div>
  );
}
