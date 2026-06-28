"use client";

import Link from "next/link";
import type { MentorTeam, MentorTeamRound } from "@/features/lecturer-mentor/types/mentor.types";

const headerCellStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  letterSpacing: "0.6px",
  textTransform: "uppercase" as const,
  lineHeight: "12px",
  padding: "12px 16px",
  textAlign: "left" as const,
};

function RoundStatusIcon({ status }: { status: MentorTeamRound["status"] }) {
  if (status === "submitted") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#10b981" />
        <path d="M6 10l2.5 2.5L14 7.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full"
        style={{ fontSize: 12, fontWeight: 700, color: "#d97706", backgroundColor: "rgba(245,158,11,0.1)", padding: "2px 8px" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="#d97706" strokeWidth="1" />
          <path d="M6 3.5V6.5L7.5 8" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Pending
      </span>
    );
  }
  if (status === "eliminated") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#ef4444" />
        <path d="M7 7l6 6M13 7l-6 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return <span style={{ color: "rgba(223,226,236,0.8)" }}>—</span>;
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M1 4.5h7M5.5 1.5L8 4.5 5.5 7.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RankBadge({ rank, isDisqualified }: { rank: number | null; isDisqualified: boolean }) {
  if (isDisqualified) {
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{ backgroundColor: "rgba(225,29,72,0.1)", borderRadius: 4, padding: "4px 8px", fontSize: 13, fontWeight: 700, color: "#be123c", fontFamily: "serif" }}
      >
        DQ
      </span>
    );
  }
  if (rank === null) return <span style={{ color: "rgba(223,226,236,0.8)" }}>—</span>;
  return (
    <span style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
      #{rank}
    </span>
  );
}

interface TeamMonitoringTableProps {
  teams: MentorTeam[];
  isLoading: boolean;
}

export function TeamMonitoringTable({ teams, isLoading }: TeamMonitoringTableProps) {
  const roundHeaders = teams[0]?.rounds.map((r) => `Round ${r.roundNumber}`) ?? [];

  return (
    <div
      className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(223,226,236,0.8)" }}>
            <th style={{ ...headerCellStyle, width: 229 }}>TEAM NAME</th>
            <th style={{ ...headerCellStyle, width: 114 }}>MEMBERS</th>
            {roundHeaders.map((h) => (
              <th key={h} style={{ ...headerCellStyle, textAlign: "center", width: 120 }}>{h.toUpperCase()}</th>
            ))}
            <th style={{ ...headerCellStyle, width: 179 }}>LAST SUBMISSION</th>
            <th style={{ ...headerCellStyle, width: 81, textAlign: "right" }}>RANK</th>
            <th style={{ ...headerCellStyle, width: 133, textAlign: "right" }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(223,226,236,0.8)" }}>
                {Array.from({ length: 5 + roundHeaders.length }).map((__, j) => (
                  <td key={j} style={{ padding: "20px 16px" }}>
                    <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: j === 0 ? 140 : "50%" }} />
                  </td>
                ))}
              </tr>
            ))
          ) : teams.length === 0 ? (
            <tr>
              <td colSpan={5 + roundHeaders.length} style={{ padding: 48, textAlign: "center", color: "#8891a5", fontSize: 14 }}>
                No teams found.
              </td>
            </tr>
          ) : (
            teams.map((team) => {
              const isElim = team.isDisqualified;
              return (
                <tr
                  key={team.id}
                  style={{
                    borderBottom: "1px solid rgba(223,226,236,0.8)",
                    opacity: isElim ? 0.5 : 1,
                    backgroundColor: isElim ? "rgba(241,245,249,0.5)" : "transparent",
                  }}
                >
                  <td style={{ padding: "0 0 0 16px" }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex flex-shrink-0 items-center justify-center rounded"
                        style={{ width: 32, height: 32, backgroundColor: team.initialBgColor || "#dcfce7", fontSize: 18, fontWeight: 600, color: "#0ea5e9" }}
                      >
                        {team.initial}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0e1528", lineHeight: "21px", textDecoration: isElim ? "line-through" : "none" }}>
                          {team.name}
                        </p>
                        <p style={{ fontSize: 13, color: "#8891a5", fontFamily: "serif", lineHeight: "19.5px" }}>
                          ID: {team.displayId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ paddingLeft: 32 }}>
                    <span
                      className="inline-flex items-center justify-center rounded-full"
                      style={{ width: 24, height: 24, backgroundColor: "rgba(223,226,236,0.8)", border: "2px solid #ffffff", fontSize: 10, color: "#0e1528" }}
                    >
                      {team.memberCount}
                    </span>
                  </td>
                  {team.rounds.map((r) => (
                    <td key={r.roundNumber} style={{ textAlign: "center", padding: "0 16px" }}>
                      <RoundStatusIcon status={r.status} />
                    </td>
                  ))}
                  <td style={{ padding: "26px 16px", fontSize: 14, color: "#8891a5" }}>
                    {team.lastSubmission ?? "--"}
                  </td>
                  <td style={{ padding: "0 16px", textAlign: "right" }}>
                    <RankBadge rank={team.rank} isDisqualified={isElim} />
                  </td>
                  <td style={{ padding: "0 16px" }}>
                    <Link
                      href={`/lecturer/teams/${team.id}?eventId=${team.eventId}`}
                      className="flex items-center justify-end gap-1"
                      style={{ fontSize: 12, fontWeight: 500, color: isElim ? "#8891a5" : "#38bdf8", letterSpacing: "0.24px", lineHeight: "12px" }}
                    >
                      View team
                      <ArrowIcon color={isElim ? "#8891a5" : "#38bdf8"} />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
