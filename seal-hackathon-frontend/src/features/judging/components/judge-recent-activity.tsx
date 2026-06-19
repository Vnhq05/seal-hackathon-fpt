import type { RecentScoringActivity } from "@/features/judging/types/judge.types";

interface JudgeRecentActivityProps {
  activities: RecentScoringActivity[];
}

export function JudgeRecentActivity({ activities }: JudgeRecentActivityProps) {
  return (
    <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)" }}>
      <div style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(223,226,236,0.8)", padding: "16px 16px 17px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          Recent Scoring Activity
        </h3>
      </div>
      <div>
        {activities.length === 0 ? (
          <p style={{ padding: 16, fontSize: 14, color: "#8891a5" }}>No recent activity.</p>
        ) : (
          activities.map((entry, idx) => (
            <div
              key={entry.id}
              className="flex items-center justify-between"
              style={{
                padding: "16px 16px 17px",
                borderBottom: idx < activities.length - 1 ? "1px solid rgba(223,226,236,0.8)" : "none",
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#0e1528", lineHeight: "21px" }}>
                  {entry.teamName}
                </p>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px", marginTop: 2 }}>
                  {entry.timeAgo}
                </p>
              </div>
              <span
                className="rounded"
                style={{
                  backgroundColor: "rgba(223,226,236,0.8)",
                  padding: "4px 8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "#0e1528",
                  lineHeight: "19.5px",
                }}
              >
                {entry.score}/{entry.maxScore}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
