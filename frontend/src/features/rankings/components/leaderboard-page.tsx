"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi, roundApi, rankingApi } from "@/lib/api";
import { useDownloadRanking } from "@/features/rankings/hooks/use-download-ranking";
import type { RankingResponse, EventResponse, RoundResponse } from "@/lib/api";

const MEDAL_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#8891a5",
  3: "#cd7f32",
};

function MedalBadge({ rank }: { rank: number }) {
  const color = MEDAL_COLORS[rank];
  if (!color) {
    return <span className="text-sm font-semibold text-seal-text">{rank}</span>;
  }
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{ width: 28, height: 28, backgroundColor: color, flexShrink: 0 }}
    >
      <span className="text-[13px] font-bold text-white">{rank}</span>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 1h8v5a4 4 0 01-8 0V1z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 3H2a1 1 0 00-1 1v1a3 3 0 003 3M13 3h3a1 1 0 011 1v1a3 3 0 01-3 3M9 10v3M6 15h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface LeaderboardPageProps {
  roundId?: string;
}

export function LeaderboardPage({ roundId: initialRoundId }: LeaderboardPageProps) {
  const downloadMutation = useDownloadRanking();

  const { data: eventsPage } = useQuery({
    queryKey: ["leaderboard-events"],
    queryFn: () => eventApi.list({ size: 50 }),
  });

  const events = useMemo(() => {
    const all = eventsPage?.content ?? [];
    return all.filter((e) => e.status === "COMPLETED" || e.status === "ACTIVE");
  }, [eventsPage]);

  const [eventId, setEventId] = useState<string>("");
  const selectedEvent = events.find((e) => e.id === eventId) ?? events[0];
  const activeEventId = selectedEvent?.id ?? "";

  const { data: rounds = [] } = useQuery({
    queryKey: ["leaderboard-rounds", activeEventId],
    queryFn: () => roundApi.list(activeEventId),
    enabled: !!activeEventId,
  });

  const [roundId, setRoundId] = useState<string>(initialRoundId || "");
  const activeRoundId = roundId || rounds[0]?.id || "";

  const { data: rankings, isLoading } = useQuery({
    queryKey: ["leaderboard-rankings", activeRoundId],
    queryFn: () => rankingApi.getRankings(activeRoundId),
    enabled: !!activeRoundId,
  });

  const sortedRankings = useMemo(() => {
    if (!rankings) return [];
    return [...rankings].sort((a, b) => a.rank - b.rank);
  }, [rankings]);

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 1440, padding: 24 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-seal-text">Leaderboard</h1>
          <p className="mt-1 text-sm text-seal-text-secondary">
            Rankings for completed and active events.
          </p>
        </div>
        {activeRoundId && (
          <button
            type="button"
            onClick={() => downloadMutation.mutate(activeRoundId)}
            disabled={downloadMutation.isPending}
            className="rounded-lg border border-seal-border bg-seal-surface px-5 py-2.5 text-[13px] font-semibold text-seal-text transition-colors hover:bg-seal-surface-elevated disabled:opacity-50"
          >
            {downloadMutation.isPending ? "Downloading..." : "Download CSV"}
          </button>
        )}
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activeEventId}
          onChange={(e) => { setEventId(e.target.value); setRoundId(""); }}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          style={{ minWidth: 240 }}
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name} — {e.season} {e.year}</option>
          ))}
          {events.length === 0 && <option value="">No events</option>}
        </select>

        <select
          value={activeRoundId}
          onChange={(e) => setRoundId(e.target.value)}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          style={{ minWidth: 180 }}
        >
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
          {rounds.length === 0 && <option value="">No rounds</option>}
        </select>

        {selectedEvent && (
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
            selectedEvent.status === "COMPLETED" ? "bg-gray-100 text-gray-500" :
            selectedEvent.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
            "bg-blue-50 text-blue-700"
          }`}>{selectedEvent.status}</span>
        )}
      </div>

      {/* Awards Summary */}
      {selectedEvent && selectedEvent.prizes.length > 0 && sortedRankings.length > 0 && (
        <div className="rounded-lg border border-seal-border bg-seal-surface overflow-hidden">
          <div className="flex items-center gap-2 border-b border-seal-border px-5 py-3">
            <TrophyIcon />
            <h3 className="text-sm font-semibold text-seal-text">Awards summary</h3>
            <span className="text-xs text-seal-text-muted">Prizes mapped to top-ranked teams</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-seal-surface-sunken text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
                <th className="px-5 py-2.5 text-left">Prize</th>
                <th className="px-5 py-2.5 text-left">Value</th>
                <th className="px-5 py-2.5 text-left">Awarded to</th>
                <th className="px-5 py-2.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-seal-border-light">
              {(() => {
                let cursor = 0;
                return selectedEvent.prizes.flatMap((p) =>
                  Array.from({ length: p.quantity }).map((_, i) => {
                    const row = sortedRankings[cursor];
                    cursor++;
                    return (
                      <tr key={`${p.id}-${i}`}>
                        <td className="px-5 py-2.5 font-medium text-seal-text">
                          {p.rank}{p.quantity > 1 ? ` #${i + 1}` : ""}
                        </td>
                        <td className="px-5 py-2.5 text-seal-text-secondary">{p.value || "—"}</td>
                        <td className="px-5 py-2.5 text-seal-text">
                          {row ? row.teamName ?? row.teamId : <span className="italic text-seal-text-muted">—</span>}
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono text-seal-text">
                          {row ? row.finalScore.toFixed(2) : "—"}
                        </td>
                      </tr>
                    );
                  }),
                );
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Ranking Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
        </div>
      ) : sortedRankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-seal-border bg-seal-surface-sunken py-16">
          <p className="text-base font-semibold text-seal-text">No rankings yet</p>
          <p className="mt-1 text-sm text-seal-text-muted">Rankings will appear here once teams have been scored.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-seal-border bg-seal-surface overflow-hidden">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-seal-surface-sunken text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
                <th className="px-5 py-3 text-left" style={{ width: 72 }}>Rank</th>
                <th className="px-5 py-3 text-left">Team</th>
                <th className="px-5 py-3 text-right" style={{ width: 120 }}>Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-seal-border-light">
              {sortedRankings.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-seal-surface-sunken/50">
                  <td className="px-5 py-3.5"><MedalBadge rank={entry.rank} /></td>
                  <td className="px-5 py-3.5 font-medium text-seal-text">{entry.teamName ?? entry.teamId}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-base font-semibold text-seal-text">{entry.finalScore.toFixed(2)}</span>
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
