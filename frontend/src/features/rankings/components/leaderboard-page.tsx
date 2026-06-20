"use client";

import { useMemo } from "react";
import { useLeaderboard } from "@/features/rankings/hooks/use-leaderboard";
import { useDownloadRanking } from "@/features/rankings/hooks/use-download-ranking";
import type { RankingResponse } from "@/lib/api";

const MEDAL_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#8891a5",
  3: "#cd7f32",
};

const headerCellStyle: React.CSSProperties = {
  backgroundColor: "#eef0f6",
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  padding: "12px 16px",
  textAlign: "left",
  borderBottom: "1px solid rgba(198,198,205,0.5)",
};

const bodyCellStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  padding: "14px 16px",
};

function MedalBadge({ rank }: { rank: number }) {
  const color = MEDAL_COLORS[rank];
  if (!color) {
    return (
      <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>
        {rank}
      </span>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{ width: 28, height: 28, backgroundColor: color, flexShrink: 0 }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: "13px" }}>
        {rank}
      </span>
    </div>
  );
}

interface LeaderboardPageProps {
  roundId: string;
}

export function LeaderboardPage({ roundId }: LeaderboardPageProps) {
  const { data: rankings, isLoading, isError } = useLeaderboard(roundId);
  const downloadMutation = useDownloadRanking();

  const sortedRankings = useMemo(() => {
    if (!rankings) return [];
    return [...rankings].sort((a, b) => a.rank - b.rank);
  }, [rankings]);

  const handleDownload = () => {
    downloadMutation.mutate(roundId);
  };

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4" style={{ padding: 64 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
          Unable to load rankings
        </p>
        <p style={{ fontSize: 14, color: "#8891a5" }}>
          Could not load leaderboard data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: 1440, padding: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0e1528",
              letterSpacing: "-0.64px",
              lineHeight: "38.4px",
            }}
          >
            Leaderboard
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Live rankings based on judging scores.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloadMutation.isPending}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
            borderRadius: 6,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            color: "#0e1528",
            cursor: "pointer",
            opacity: downloadMutation.isPending ? 0.6 : 1,
          }}
        >
          {downloadMutation.isPending ? "Downloading..." : "Download CSV"}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ padding: 64 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      ) : sortedRankings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg py-16"
          style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No rankings yet</p>
          <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
            Rankings will appear here once teams have been scored.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(198,198,205,0.5)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, width: 72 }}>Rank</th>
                <th style={headerCellStyle}>Team</th>
                <th style={{ ...headerCellStyle, width: 120 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedRankings.map((entry: RankingResponse, idx: number) => (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom:
                      idx < sortedRankings.length - 1
                        ? "1px solid rgba(198,198,205,0.3)"
                        : "none",
                  }}
                >
                  <td style={bodyCellStyle}>
                    <MedalBadge rank={entry.rank} />
                  </td>
                  <td style={bodyCellStyle}>
                    <span style={{ fontWeight: 400, color: "#0e1528" }}>
                      {entry.teamName ?? entry.teamId}
                    </span>
                  </td>
                  <td style={bodyCellStyle}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
                      {entry.finalScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
