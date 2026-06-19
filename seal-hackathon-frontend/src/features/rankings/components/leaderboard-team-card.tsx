import type { MyTeamSummary } from "@/features/rankings/types/leaderboard.types";

const cardStyle: React.CSSProperties = {
  position: "relative",
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: 25,
  boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
};

const accentBgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundColor: "#dcfce7",
  opacity: 0.1,
};

const iconBoxStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  backgroundColor: "#eef0f6",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  filter: "drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.05))",
};

const trackBadgeStyle: React.CSSProperties = {
  backgroundColor: "#c5c9d8",
  borderRadius: 2,
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: 700,
  color: "#0ea5e9",
  letterSpacing: "0.25px",
  textTransform: "uppercase" as const,
  lineHeight: "10px",
};

const rankChangeStyle: React.CSSProperties = {
  backgroundColor: "#dcfce7",
  borderRadius: 4,
  padding: "4px 8px",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

function TeamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="8" width="4" height="10" rx="1" stroke="#dcfce7" strokeWidth="1.5" fill="none" />
      <rect x="8" y="2" width="4" height="16" rx="1" stroke="#dcfce7" strokeWidth="1.5" fill="none" />
      <rect x="14" y="5" width="4" height="13" rx="1" stroke="#dcfce7" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path d="M4.5 7.5V1.5M4.5 1.5L1.5 4.5M4.5 1.5L7.5 4.5" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface LeaderboardTeamCardProps {
  myTeam: MyTeamSummary;
}

export function LeaderboardTeamCard({ myTeam }: LeaderboardTeamCardProps) {
  const intPart = Math.floor(myTeam.totalScore);
  const decPart = (myTeam.totalScore % 1).toFixed(2).substring(1);

  return (
    <div className="flex items-center justify-between" style={cardStyle}>
      <div style={accentBgStyle} />
      <div className="relative flex items-center gap-4">
        <div style={iconBoxStyle}>
          <TeamIcon />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
              Your Team
            </span>
            <span style={trackBadgeStyle}>{myTeam.trackName}</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#0e1528", letterSpacing: "-0.24px", lineHeight: "31.2px" }}>
            {myTeam.teamName}
          </span>
        </div>
      </div>
      <div className="relative flex items-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px", textAlign: "center" }}>
            Current Rank
          </span>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", lineHeight: "28.8px", textAlign: "center" }}>
              #{myTeam.currentRank}
            </span>
            {myTeam.rankChange !== 0 && (
              <span style={rankChangeStyle}>
                <ArrowUpIcon />
                <span style={{ fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px", lineHeight: "12px" }}>
                  {Math.abs(myTeam.rankChange)}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px", textAlign: "center" }}>
            Total Score
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#0e1528" }}>{intPart}</span>
            <span style={{ fontSize: 14, color: "#8891a5" }}>{decPart}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
