import type { LeaderboardTeam } from "@/features/rankings/types/leaderboard.types";
import { LeaderboardStatusBadge } from "@/features/rankings/components/leaderboard-status-badge";

const RANK_COLORS: Record<number, { text: string; border: string }> = {
  1: { text: "#dec29a", border: "#fcdeb5" },
  2: { text: "rgba(101,217,243,0.2)", border: "rgba(223,226,236,0.8)" },
  3: { text: "#98805d", border: "#98805d" },
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: "19.5px",
};

const cellPadding: React.CSSProperties = {
  padding: "0 16px",
};

function TeamNameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#0e1528" strokeWidth="1.2" />
      <path d="M4.5 6.5L6 8L9 5" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface LeaderboardTableRowProps {
  team: LeaderboardTeam;
  isLast: boolean;
  showTrack?: boolean;
}

export function LeaderboardTableRow({
  team,
  isLast,
  showTrack = true,
}: LeaderboardTableRowProps) {
  const isUserTeam = team.isCurrentUserTeam;
  const rankColor = isUserTeam
    ? { text: "#0e1528", border: "#38bdf8" }
    : RANK_COLORS[team.rank];
  const hasRankIndicator = !!rankColor;

  const rowStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: isUserTeam ? "#dcfce7" : "transparent",
    borderBottom: isLast ? "none" : "1px solid rgba(223,226,236,0.8)",
    height: 58,
  };

  const textColor = isUserTeam ? "#000000" : "#0e1528";
  const secondaryColor = isUserTeam ? "#000000" : "#8891a5";
  const teamNameColor =
    isUserTeam || team.rank <= 3 ? "#0e1528" : "#8891a5";
  const showTotal = team.roundScores.length > 1;

  return (
    <tr style={rowStyle}>
      <td style={{ ...cellPadding, width: 64, position: "relative" }}>
        {hasRankIndicator && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: rankColor.border,
            }}
          />
        )}
        <span
          style={{
            ...monoStyle,
            color: rankColor?.text ?? secondaryColor,
          }}
        >
          {String(team.rank).padStart(2, "0")}
        </span>
      </td>
      <td style={{ ...cellPadding, width: 256 }}>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: isUserTeam ? "#000000" : teamNameColor,
              lineHeight: "25.2px",
            }}
          >
            {team.name}
          </span>
          {isUserTeam && <TeamNameIcon />}
        </div>
      </td>
      {showTrack && (
        <td style={{ ...cellPadding, width: 124 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: secondaryColor,
              lineHeight: "21px",
              opacity: isUserTeam ? 0.8 : 1,
            }}
          >
            {team.trackName}
          </span>
        </td>
      )}
      {team.roundScores.map((roundScore) => (
        <td
          key={roundScore.roundId}
          style={{ ...cellPadding, width: 125, textAlign: "right" }}
        >
          <span style={{ ...monoStyle, color: textColor }}>
            {roundScore.score.toFixed(2)}
          </span>
        </td>
      ))}
      {showTotal && (
        <td style={{ ...cellPadding, width: 118, textAlign: "right" }}>
          <span style={{ ...monoStyle, color: textColor }}>
            {team.totalScore.toFixed(2)}
          </span>
        </td>
      )}
      <td style={{ ...cellPadding, width: 174, textAlign: "center" }}>
        <LeaderboardStatusBadge
          status={team.status}
          isCurrentUserTeam={isUserTeam}
        />
      </td>
    </tr>
  );
}
