import type { MentorSummary } from "@/features/lecturer-mentor/types/mentor.types";

interface MentorDashboardStatsProps {
  summary: MentorSummary;
}

export function MentorDashboardStats({ summary }: MentorDashboardStatsProps) {
  return (
    <div
      className="flex items-center justify-between overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        background: "linear-gradient(135deg, #38bdf8 0%, #4338ca 100%)",
        padding: "28px 32px",
        color: "#ffffff",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: 9999,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <div className="relative">
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "1.2px", textTransform: "uppercase", opacity: 0.8, lineHeight: "12px" }}>
          {summary.hackathonName}
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.24px", lineHeight: "31.2px", marginTop: 4 }}>
          {summary.trackName}
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
          You are the assigned mentor for this track
        </p>
      </div>
      <div className="relative grid grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, letterSpacing: "0.24px" }}>SUBMISSIONS</span>
          <span style={{ fontSize: 32, fontWeight: 700 }}>
            {summary.submittedCount}
            <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6 }}>/{summary.totalTeams}</span>
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, letterSpacing: "0.24px" }}>ROUND</span>
          <span style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{summary.currentRound}</span>
        </div>
        <div className="flex flex-col items-center">
          <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7, letterSpacing: "0.24px" }}>DEADLINE</span>
          <span style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: "#fbbf24" }}>
            {summary.timeRemaining ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
