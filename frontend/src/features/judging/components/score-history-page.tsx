"use client";

import { useScoreHistory } from "@/features/judging/hooks/use-score-history";
import { ScoreHistoryCard } from "@/features/judging/components/score-history-card";

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />
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
            <ScoreHistoryCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}
