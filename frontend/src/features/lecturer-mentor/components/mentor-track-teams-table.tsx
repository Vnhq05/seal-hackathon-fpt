"use client";

import Link from "next/link";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { TrackTeamEntry, TrackTeamSubmissionStatus } from "@/features/lecturer-mentor/types/mentor-track.types";

const STATUS_CONFIG: Record<TrackTeamSubmissionStatus, { bg: string; border: string; text: string; label: string }> = {
  submitted: { bg: "rgba(16,185,129,0.1)", border: "#10b981", text: "#10b981", label: "Submitted" },
  draft: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b", text: "#f59e0b", label: "Draft" },
  missing: { bg: "rgba(244,63,94,0.1)", border: "#f43f5e", text: "#f43f5e", label: "Missing" },
};

function StatusIcon({ status }: { status: TrackTeamSubmissionStatus }) {
  const color = STATUS_CONFIG[status].text;
  if (status === "submitted") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5L4.5 7.5L8 3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "draft") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3" stroke={color} strokeWidth="1.2" />
        <path d="M5 3v2.5L6.5 7" stroke={color} strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M3 3l4 4M7 3l-4 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true" style={{ cursor: "pointer" }}>
      <path d="M1 1h13M3.5 5h8M6 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const headerCellStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.6px",
  textTransform: "uppercase" as const,
  lineHeight: "12px",
  padding: "12px 24px",
  textAlign: "left" as const,
};

interface Props {
  teams: TrackTeamEntry[];
  totalTeamCount: number;
}

export function MentorTrackTeamsTable({ teams, totalTeamCount }: Props) {
  const portalBase = usePortalBase();
  return (
    <div
      className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(223,226,236,0.8)",
        boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "24px 24px 25px", borderBottom: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff" }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          Teams in this Track
        </h2>
        <button type="button" style={{ background: "none", border: "none", padding: 6, cursor: "pointer" }}>
          <FilterIcon />
        </button>
      </div>

      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(223,226,236,0.8)" }}>
            <th style={{ ...headerCellStyle, width: 237 }}>TEAM</th>
            <th style={{ ...headerCellStyle, width: 137 }}>MEMBERS</th>
            <th style={{ ...headerCellStyle, width: 164 }}>STATUS (R2)</th>
            <th style={{ ...headerCellStyle, width: 102, textAlign: "right" }}>RANK</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            const status = STATUS_CONFIG[team.submissionStatus];
            return (
              <tr key={team.id} style={{ borderTop: idx > 0 ? "1px solid rgba(223,226,236,0.8)" : "none" }}>
                <td style={{ padding: "0 0 0 24px" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex flex-shrink-0 items-center justify-center rounded"
                      style={{
                        width: 32, height: 32,
                        backgroundColor: team.initialBgColor || "rgba(99,102,241,0.1)",
                        fontSize: 12, fontWeight: 700,
                        color: team.initialBgColor ? "#0e1528" : "#38bdf8",
                        fontFamily: "serif",
                      }}
                    >
                      {team.initial}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px", lineHeight: "12px" }}>
                        {team.name}
                      </span>
                      <span style={{ fontSize: 13, color: "#8891a5", fontFamily: "serif", lineHeight: "19.5px" }}>
                        ID: {team.displayId}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ paddingLeft: 48 }}>
                  <span
                    className="inline-flex items-center justify-center rounded-full"
                    style={{
                      width: 24, height: 24,
                      backgroundColor: "#dcd9db",
                      border: "1px solid #ffffff",
                      fontSize: 10, fontWeight: 700, color: "#0e1528",
                    }}
                  >
                    {team.memberCount}
                  </span>
                </td>
                <td style={{ padding: "22px 24px 22px 48px" }}>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      backgroundColor: status.bg,
                      borderLeft: `2px solid ${status.border}`,
                      borderRadius: 4,
                      padding: "4px 8px 4px 10px",
                      fontSize: 11, fontWeight: 400, color: status.text,
                    }}
                  >
                    <StatusIcon status={team.submissionStatus} />
                    {status.label}
                  </span>
                </td>
                <td style={{ padding: "23px 24px", textAlign: "right" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0e1528", fontFamily: "serif", lineHeight: "19.5px" }}>
                    {team.rank ?? "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalTeamCount > teams.length && (
        <div
          className="flex items-center justify-center gap-1"
          style={{ padding: "17px 16px 16px", borderTop: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#eef0f6" }}
        >
          <Link
            href={`${portalBase}/teams`}
            style={{ fontSize: 12, fontWeight: 500, color: "#38bdf8", letterSpacing: "0.24px", lineHeight: "12px" }}
          >
            View all {totalTeamCount} teams
          </Link>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M3 1.5L7.5 5.5L3 9.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}
