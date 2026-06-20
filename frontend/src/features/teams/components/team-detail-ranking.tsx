import type { TeamRanking } from "@/features/teams/types/team.types";

interface TeamDetailRankingProps {
  ranking: TeamRanking;
}

function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 6h10M6 1c-2 2-2 8 0 10M6 1c2 2 2 8 0 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function TeamDetailRanking({ ranking }: TeamDetailRankingProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 128,
          height: 128,
          backgroundColor: "#dcfce7",
          opacity: 0.5,
          filter: "blur(20px)",
          top: -40,
          right: -40,
        }}
      />

      <span
        style={{
          fontSize: 12,
          color: "#8891a5",
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          lineHeight: "12px",
          paddingBottom: 16,
        }}
      >
        CURRENT STANDING
      </span>

      <span
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#0e1528",
          letterSpacing: "-2.8px",
          lineHeight: "56px",
          paddingBottom: 4,
        }}
      >
        #{ranking.trackRank}
      </span>

      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#0e1528",
          lineHeight: "25.2px",
        }}
      >
        in {ranking.trackName}
      </span>

      <span
        className="mt-3 flex items-center gap-1 rounded-full"
        style={{
          backgroundColor: "rgba(223,226,236,0.8)",
          border: "1px solid rgba(223,226,236,0.8)",
          padding: "5px 9px",
          fontSize: 12,
          color: "#8891a5",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        <GlobeIcon />
        #{ranking.overallRank} Overall Ranking
      </span>
    </div>
  );
}
