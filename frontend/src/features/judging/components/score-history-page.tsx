"use client";

import { useScoreHistory } from "@/features/judging/hooks/use-score-history";
import type { ScoreHistoryEntry } from "@/features/judging/types/judge.types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(198,198,205,0.5)",
  borderRadius: 12,
  padding: 24,
};

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryCard({ entry }: { entry: ScoreHistoryEntry }) {
  return (
    <div style={cardStyle}>
      <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>{entry.teamName}</p>
          <p style={{ fontSize: 12, color: "#2dd4bf", marginTop: 2 }}>
            {entry.hackathonName} &middot; {entry.roundName}
          </p>
        </div>
        <span
          className="rounded-md"
          style={{
            backgroundColor: "#ecfdf5",
            color: "#047857",
            padding: "4px 12px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {entry.totalWeightedScore.toFixed(2)}/{entry.maxScore}
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${entry.criteriaBreakdown.length}, 1fr)`,
          marginBottom: 8,
        }}
      >
        {entry.criteriaBreakdown.map((c) => (
          <div
            key={c.criterionName}
            className="rounded-lg"
            style={{
              backgroundColor: "#eef0f6",
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 11, color: "#2dd4bf", marginBottom: 2 }}>{c.criterionName}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>
              {c.score}/{c.maxScore}
            </p>
            <p style={{ fontSize: 10, color: "#8891a5" }}>Weight: {c.weight}%</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "#8891a5" }}>
        Scored on {formatDate(entry.scoredAt)}
      </p>
    </div>
  );
}

export function ScoreHistoryPage() {
  const { data, isLoading } = useScoreHistory();
  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" style={{ padding: 32 }}>
        <SkeletonBlock height={32} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} height={140} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ padding: 32 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.24px" }}>
          Score History
        </h1>
        <p style={{ fontSize: 14, color: "#2dd4bf", marginTop: 4 }}>
          Review your past scoring activities.
        </p>
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: 14, color: "#8891a5", padding: 24 }}>No scores recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((e) => (
            <HistoryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
