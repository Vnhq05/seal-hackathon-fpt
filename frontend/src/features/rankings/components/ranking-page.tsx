"use client";

import { useMemo, useState } from "react";
import type { RoundType } from "@/lib/api/types";
import { LeaderboardTable } from "@/features/rankings/components/leaderboard-table";
import { LeaderboardTeamCard } from "@/features/rankings/components/leaderboard-team-card";
import {
  useSeasonLeaderboard,
  useSeasonLeaderboardOptions,
} from "@/features/rankings/hooks/use-season-leaderboard";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { findMyTeamSummary } from "@/features/rankings/utils/leaderboard.mapper";

export function RankingPage() {
  const [season, setSeason] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [trackId, setTrackId] = useState<string>("");
  const [roundType, setRoundType] = useState<RoundType | "">("");

  const { data: optionBoards = [] } = useSeasonLeaderboardOptions();
  const { data: myEventTeams = [] } = useMyTeamsAllEvents();

  const teamIdByEvent = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of myEventTeams) {
      if (item.team?.id) {
        map.set(item.event.id, item.team.id);
      }
    }
    return map;
  }, [myEventTeams]);

  const effectiveTrackId = roundType === "PRELIMINARY" ? trackId : "";

  const { enrichedBoards, isLoading, isEmpty } = useSeasonLeaderboard(
    {
      season: season || undefined,
      year: year ? Number(year) : undefined,
      trackId: effectiveTrackId || undefined,
      roundType: roundType || undefined,
    },
    teamIdByEvent,
  );

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

  const showTrackColumn = roundType !== "PRELIMINARY" || !effectiveTrackId;

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 1440, padding: 24 }}>
      <div>
        <h1 className="text-[32px] font-bold tracking-tight text-seal-text">Rankings</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Team standings across hackathon events. Preliminary rankings are per track; final rankings are overall.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
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
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
          style={{ minWidth: 120 }}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={roundType}
          onChange={(e) => {
            const next = e.target.value as RoundType | "";
            setRoundType(next);
            if (next !== "PRELIMINARY") setTrackId("");
          }}
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
          style={{ minWidth: 180 }}
        >
          <option value="">All rounds</option>
          <option value="PRELIMINARY">Preliminary (per track)</option>
          <option value="FINAL">Finals (overall)</option>
        </select>

        {roundType === "PRELIMINARY" && tracks.length > 0 && (
          <select
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
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
        <LeaderboardTable rankings={[]} isLoading showTrack={showTrackColumn} />
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-navy bg-seal-surface-sunken py-16">
          <p className="text-base font-semibold text-seal-text">No rankings found</p>
          <p className="mt-1 text-sm text-seal-text-muted">
            Results may not be published yet, or try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {enrichedBoards.map(({ board, teams }) => {
            const myTeam = findMyTeamSummary(teams);
            return (
              <div key={board.eventId} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-seal-text">{board.eventName}</h2>
                    <p className="text-sm text-seal-text-secondary">
                      {board.season} {board.year} &middot; {board.roundName}
                      {board.roundType ? ` (${board.roundType})` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-seal-surface-elevated px-3 py-1 text-xs font-medium text-seal-text-secondary">
                    {teams.length} teams
                  </span>
                </div>

                {myTeam && (
                  <LeaderboardTeamCard
                    myTeam={{
                      teamId: myTeam.teamId,
                      teamName: myTeam.name,
                      trackName: myTeam.trackName,
                      currentRank: myTeam.rank,
                      rankChange: myTeam.rankChange,
                      totalScore: myTeam.totalScore,
                    }}
                  />
                )}

                <LeaderboardTable
                  rankings={teams}
                  isLoading={false}
                  showTrack={showTrackColumn && board.tracks.length > 1}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
