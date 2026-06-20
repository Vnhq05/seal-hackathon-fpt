import type { TeamStatus } from "@/features/rankings/types/leaderboard.types";

const dotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 9999,
  backgroundColor: "#38bdf8",
  flexShrink: 0,
};

const badgeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.24px",
  lineHeight: "12px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
};

const STATUS_LABELS: Record<TeamStatus, string> = {
  promoted: "Promoted",
  active: "Active",
  at_risk: "At Risk",
  eliminated: "Eliminated",
};

function LightningIcon() {
  return (
    <svg
      width="9"
      height="12"
      viewBox="0 0 9 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 0.5L0.5 7H4.5L3.5 11.5L8.5 5H4.5L5.5 0.5Z"
        fill="#0e1528"
      />
    </svg>
  );
}

interface LeaderboardStatusBadgeProps {
  status: TeamStatus;
  isCurrentUserTeam: boolean;
}

export function LeaderboardStatusBadge({
  status,
  isCurrentUserTeam,
}: LeaderboardStatusBadgeProps) {
  if (isCurrentUserTeam && status === "active") {
    return (
      <span
        className="inline-flex items-center gap-1"
        style={{
          backgroundColor: "#38bdf8",
          borderRadius: 4,
          padding: "4px 8px",
        }}
      >
        <LightningIcon />
        <span style={{ ...badgeLabelStyle, color: "#0e1528" }}>Active</span>
      </span>
    );
  }

  if (status === "at_risk") {
    return (
      <span
        className="inline-flex items-center justify-center"
        style={{
          border: "1px solid rgba(223,226,236,0.8)",
          borderRadius: 4,
          padding: "5px 9px",
        }}
      >
        <span style={{ ...badgeLabelStyle, color: "#8891a5" }}>
          {STATUS_LABELS[status]}
        </span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        backgroundColor: "rgba(223,226,236,0.8)",
        borderRadius: 4,
        padding: "4px 8px",
      }}
    >
      <span style={dotStyle} />
      <span style={{ ...badgeLabelStyle, color: "#8891a5" }}>
        {STATUS_LABELS[status]}
      </span>
    </span>
  );
}
