"use client";

import type { MentorTeam } from "@/features/lecturer-mentor/types/mentor.types";

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5V8.5M6 8.5L3 5.5M6 8.5L9 5.5M1.5 10.5H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface TeamMonitoringHeaderProps {
  trackName: string;
  hackathonName: string;
  submittedCount: number;
  totalTeams: number;
  currentRound: string;
  deadline: string | null;
  teams: MentorTeam[];
}

export function TeamMonitoringHeader({
  trackName,
  hackathonName,
  submittedCount,
  totalTeams,
  currentRound,
  deadline,
  teams,
}: TeamMonitoringHeaderProps) {
  const handleExport = () => {
    const csv = [
      "teamId,teamName,memberCount,lastSubmission,isDisqualified",
      ...teams.map(
        (t) =>
          `${t.id},"${t.name}",${t.memberCount},${t.lastSubmission ?? ""},${t.isDisqualified}`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teams-${trackName.replace(/\s+/g, "-")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-end justify-between" style={{ paddingBottom: 8 }}>
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Teams — {trackName} · {hackathonName}
        </h1>
        <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "#f59e0b", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 400, color: "#8891a5", lineHeight: "21px" }}>
            {submittedCount} / {totalTeams} teams submitted for {currentRound}
            {deadline && ` — deadline closes in ${deadline}`}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-2"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(223,226,236,0.8)",
          borderRadius: 4,
          padding: "9px 17px",
          fontSize: 12,
          fontWeight: 500,
          color: "#0e1528",
          letterSpacing: "0.24px",
          lineHeight: "12px",
          cursor: "pointer",
        }}
      >
        <DownloadIcon />
        Export CSV
      </button>
    </div>
  );
}
