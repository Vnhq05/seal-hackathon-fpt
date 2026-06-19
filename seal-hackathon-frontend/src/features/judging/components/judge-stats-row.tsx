import type { JudgeDashboardStats } from "@/features/judging/types/judge.types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: 25,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  paddingBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: "-0.64px",
  lineHeight: "38.4px",
};

interface JudgeStatsRowProps {
  stats: JudgeDashboardStats;
}

export function JudgeStatsRow({ stats }: JudgeStatsRowProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div style={cardStyle}>
        <p style={labelStyle}>Rounds Assigned</p>
        <p style={{ ...valueStyle, color: "#0e1528" }}>{stats.roundsAssigned}</p>
      </div>
      <div style={cardStyle}>
        <p style={labelStyle}>Total Submissions to Score</p>
        <p style={{ ...valueStyle, color: "#0e1528" }}>{stats.totalSubmissions}</p>
      </div>
      <div style={cardStyle}>
        <p style={labelStyle}>Scored</p>
        <p style={{ ...valueStyle, color: "#10b981" }}>{stats.scored}</p>
      </div>
      <div style={cardStyle}>
        <p style={labelStyle}>Remaining</p>
        <p style={{ ...valueStyle, color: "#f59e0b" }}>{stats.remaining}</p>
      </div>
    </div>
  );
}
