"use client";

import { useTeamRankings } from "@/features/teams/hooks/use-team-rankings";
import type { RankingResponse } from "@/lib/api";

const MEDAL_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#8891a5",
  3: "#cd7f32",
};

const tableWrapperStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 12,
  overflow: "hidden",
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
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#0e1528",
        }}
      >
        {rank}
      </span>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 28,
        height: 28,
        backgroundColor: color,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: "13px",
        }}
      >
        {rank}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: "64px 24px" }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="28"
          width="12"
          height="16"
          rx="2"
          stroke="rgba(223,226,236,0.8)"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="18"
          y="12"
          width="12"
          height="32"
          rx="2"
          stroke="rgba(223,226,236,0.8)"
          strokeWidth="2"
          fill="none"
        />
        <rect
          x="32"
          y="20"
          width="12"
          height="24"
          rx="2"
          stroke="rgba(223,226,236,0.8)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#0e1528",
          marginTop: 16,
        }}
      >
        No rankings yet
      </p>
      <p
        style={{
          fontSize: 14,
          color: "#8891a5",
          marginTop: 4,
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        Rankings will appear here once teams have been scored.
      </p>
    </div>
  );
}

interface TeamRankingPageProps {
  roundId: string;
}

export function TeamRankingPage({ roundId }: TeamRankingPageProps) {
  const { data: rankings, isLoading, isError } = useTeamRankings(roundId);

  if (isLoading) {
    return (
      <div className="flex min-h-full flex-col">
        <div
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid rgba(223,226,236,0.8)",
            padding: "32px 24px 33px",
          }}
        >
          <div style={{ maxWidth: 1280 }}>
            <div
              className="h-8 w-64 animate-pulse rounded"
              style={{ backgroundColor: "rgba(223,226,236,0.8)" }}
            />
            <div
              className="mt-2 h-4 w-96 animate-pulse rounded"
              style={{ backgroundColor: "rgba(223,226,236,0.8)" }}
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !rankings) {
    return (
      <div className="flex min-h-full flex-col">
        <div
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid rgba(223,226,236,0.8)",
            padding: "32px 24px 33px",
          }}
        >
          <div style={{ maxWidth: 1280 }}>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0e1528",
                letterSpacing: "-0.64px",
                lineHeight: "38.4px",
              }}
            >
              Team Rankings
            </h1>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
              Unable to load rankings
            </p>
            <p style={{ fontSize: 14, color: "#8891a5" }}>
              Could not load team rankings. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasRankings = rankings.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* Page header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(223,226,236,0.8)",
          padding: "32px 24px 33px",
        }}
      >
        <div style={{ maxWidth: 1280 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0e1528",
              letterSpacing: "-0.64px",
              lineHeight: "38.4px",
            }}
          >
            Team Rankings
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#8891a5",
              lineHeight: "21px",
              marginTop: 4,
            }}
          >
            Live leaderboard based on judging scores.
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto"
        style={{ padding: 24 }}
      >
        <div style={{ maxWidth: 1280 }}>
          {!hasRankings ? (
            <EmptyState />
          ) : (
            <div style={tableWrapperStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, width: 72 }}>Rank</th>
                    <th style={headerCellStyle}>Team</th>
                    <th style={{ ...headerCellStyle, width: 120 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((entry: RankingResponse, idx: number) => {
                    const rowStyle: React.CSSProperties = {
                      borderBottom:
                        idx < rankings.length - 1
                          ? "1px solid rgba(198,198,205,0.3)"
                          : "none",
                    };

                    return (
                      <tr key={entry.id} style={rowStyle}>
                        <td style={bodyCellStyle}>
                          <MedalBadge rank={entry.rank} />
                        </td>
                        <td style={bodyCellStyle}>
                          <span style={{ fontWeight: 400, color: "#0e1528" }}>
                            {entry.teamName ?? entry.teamId}
                          </span>
                        </td>
                        <td style={bodyCellStyle}>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              color: "#0e1528",
                            }}
                          >
                            {entry.finalScore}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
