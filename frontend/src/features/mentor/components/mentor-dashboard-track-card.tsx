import Link from "next/link";
import type { MentorSummary } from "@/features/mentor/types/mentor.types";

function TrackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="14" height="14" rx="3" stroke="#38bdf8" strokeWidth="1.5" />
      <path d="M6 9h6M9 6v6" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MentorDashboardTrackCardProps {
  summary: MentorSummary;
  portalBase?: string;
}

export function MentorDashboardTrackCard({ summary, portalBase = "/mentor" }: MentorDashboardTrackCardProps) {
  const progressPercent = summary.totalTeams > 0
    ? Math.round((summary.submittedCount / summary.totalTeams) * 100)
    : 0;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg"
      style={{ backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center justify-between" style={{ borderBottom: "1px solid rgba(223,226,236,0.8)", padding: "20px 24px" }}>
        <div className="flex items-center gap-2">
          <TrackIcon />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>My Track</h2>
        </div>
        <Link
          href={`${portalBase}/tracks`}
          style={{ fontSize: 12, fontWeight: 500, color: "#38bdf8", letterSpacing: "0.24px" }}
        >
          View details →
        </Link>
      </div>

      <div style={{ padding: 24 }}>
        <div
          className="flex flex-col gap-4 rounded-lg"
          style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: 21 }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>{summary.trackName}</span>
            <span
              className="flex items-center gap-1 rounded"
              style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "#10b981" }}
            >
              Active
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5" }}>
                Submissions for {summary.currentRound}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0e1528" }}>
                {summary.submittedCount}/{summary.totalTeams} ({progressPercent}%)
              </span>
            </div>
            <div style={{ width: "100%", height: 6, backgroundColor: "rgba(223,226,236,0.8)", borderRadius: 9999 }}>
              <div style={{ width: `${progressPercent}%`, height: 6, backgroundColor: "#38bdf8", borderRadius: 9999 }} />
            </div>
          </div>

          <div className="flex gap-3" style={{ borderTop: "1px solid rgba(198,198,205,0.5)", paddingTop: 16 }}>
            <Link
              href={`${portalBase}/teams`}
              className="flex items-center gap-2"
              style={{ backgroundColor: "#38bdf8", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#ffffff", letterSpacing: "0.24px" }}
            >
              View Teams <ArrowIcon />
            </Link>
            <Link
              href={`${portalBase}/tracks`}
              className="flex items-center gap-2"
              style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px" }}
            >
              Track Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
