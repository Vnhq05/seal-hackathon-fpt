"use client";

import { useQuery } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api/ranking.api";
import type { EventRankingBoard } from "@/lib/api/ranking.api";
import type { RoundType } from "@/lib/api/types";
import type { LeaderboardTeam } from "@/features/rankings/types/leaderboard.types";
import { mapEventBoardToLeaderboardTeams } from "@/features/rankings/utils/leaderboard.mapper";

export interface SeasonLeaderboardParams {
  season?: string;
  year?: number;
  trackId?: string;
  roundType?: RoundType;
}

export interface EnrichedEventBoard {
  board: EventRankingBoard;
  teams: LeaderboardTeam[];
}

async function enrichBoards(
  boards: EventRankingBoard[],
  teamIdByEvent: Map<string, string>,
): Promise<EnrichedEventBoard[]> {
  return Promise.all(
    boards.map(async (board) => {
      let advancements;
      try {
        advancements = await rankingApi.getAdvancements(board.roundId);
      } catch {
        advancements = undefined;
      }
      const currentTeamId = teamIdByEvent.get(board.eventId);
      return {
        board,
        teams: mapEventBoardToLeaderboardTeams(board, advancements, currentTeamId),
      };
    }),
  );
}

export function useSeasonLeaderboardOptions() {
  return useQuery({
    queryKey: ["season-rankings-options"],
    queryFn: () => rankingApi.getSeasonRankings(),
  });
}

export function useSeasonLeaderboard(
  params: SeasonLeaderboardParams,
  teamIdByEvent: Map<string, string> = new Map(),
) {
  const boardsQuery = useQuery({
    queryKey: ["season-rankings", params.season, params.year, params.trackId, params.roundType],
    queryFn: () =>
      rankingApi.getSeasonRankings({
        season: params.season || undefined,
        year: params.year,
        trackId: params.trackId || undefined,
        roundType: params.roundType || undefined,
      }),
  });

  const enrichedQuery = useQuery({
    queryKey: [
      "season-leaderboard-enriched",
      boardsQuery.data,
      [...teamIdByEvent.entries()],
    ],
    queryFn: () => enrichBoards(boardsQuery.data ?? [], teamIdByEvent),
    enabled: (boardsQuery.data?.length ?? 0) > 0,
  });

  return {
    enrichedBoards: enrichedQuery.data ?? [],
    isLoading: boardsQuery.isLoading || enrichedQuery.isLoading,
    isEmpty: !boardsQuery.isLoading && (boardsQuery.data?.length ?? 0) === 0,
  };
}
