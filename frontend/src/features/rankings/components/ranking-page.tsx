"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api/ranking.api";
import type { EventRankingBoard } from "@/lib/api/ranking.api";

const MEDAL_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#8891a5",
  3: "#cd7f32",
};

function MedalBadge({ rank }: { rank: number }) {
  const color = MEDAL_COLORS[rank];
  if (!color) return <span className="text-sm font-semibold text-seal-text">{rank}</span>;
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{ width: 28, height: 28, backgroundColor: color, flexShrink: 0 }}
    >
      <span className="text-[13px] font-bold text-white">{rank}</span>
    </div>
  );
}

function EventRankingSection({ board }: { board: EventRankingBoard }) {
  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-seal-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-seal-text">{board.eventName}</h2>
          <p className="text-sm text-seal-text-secondary">
            {board.season} {board.year} &middot; {board.roundName}
          </p>
        </div>
        <span className="rounded-full bg-seal-surface-elevated px-3 py-1 text-xs font-medium text-seal-text-secondary">
          {board.rankings.length} teams
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-seal-surface-sunken text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
            <th className="px-5 py-3 text-left" style={{ width: 72 }}>Rank</th>
            <th className="px-5 py-3 text-left">Team</th>
            {board.tracks.length > 1 && <th className="px-5 py-3 text-left">Track</th>}
            <th className="px-5 py-3 text-right" style={{ width: 120 }}>Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-seal-border-light">
          {board.rankings.map((entry) => (
            <tr key={entry.id} className="hover:bg-seal-surface-sunken/50">
              <td className="px-5 py-3.5"><MedalBadge rank={entry.rank} /></td>
              <td className="px-5 py-3.5 font-medium text-seal-text">{entry.teamName ?? entry.teamId}</td>
              {board.tracks.length > 1 && (
                <td className="px-5 py-3.5 text-seal-text-secondary">{entry.trackName ?? "—"}</td>
              )}
              <td className="px-5 py-3.5 text-right font-semibold text-seal-text">{entry.finalScore.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankingPage() {
  const [season, setSeason] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [trackId, setTrackId] = useState<string>("");

  const { data: optionBoards = [] } = useQuery({
    queryKey: ["season-rankings-options"],
    queryFn: () => rankingApi.getSeasonRankings(),
  });

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["season-rankings", season, year, trackId],
    queryFn: () =>
      rankingApi.getSeasonRankings({
        season: season || undefined,
        year: year ? Number(year) : undefined,
        trackId: trackId || undefined,
      }),
  });

  const seasons = useMemo(
    () => [...new Set(optionBoards.map((b) => b.season))].sort(),
    [optionBoards],
  );

  const years = useMemo(
    () => [...new Set(optionBoards.map((b) => b.year))].sort((a, b) => b - a),
    [optionBoards],
  );

  const tracks = useMemo(() => {
    const map = new Map<string, string>();
    for (const board of optionBoards) {
      for (const track of board.tracks) {
        map.set(track.id, track.name);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [optionBoards]);

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 1440, padding: 24 }}>
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-seal-text">Rankings</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Team standings across hackathon events.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          style={{ minWidth: 160 }}
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          style={{ minWidth: 120 }}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {tracks.length > 0 && (
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
            style={{ minWidth: 180 }}
          >
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-seal-border bg-seal-surface-sunken py-16">
          <p className="text-base font-semibold text-seal-text">No rankings found</p>
          <p className="mt-1 text-sm text-seal-text-muted">Try adjusting season or year filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {boards.map((board) => (
            <EventRankingSection key={board.eventId} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}
