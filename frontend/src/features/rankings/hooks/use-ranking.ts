"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api/ranking.api";

export const ROUND_RANKINGS_KEY = "round-rankings" as const;
export const TEAM_RANKING_KEY = "team-ranking" as const;
export const ROUND_ADVANCEMENTS_KEY = "round-advancements" as const;
export const PUBLISHED_RESULTS_KEY = "published-results" as const;

export function useRoundRankings(roundId: string, trackId?: string) {
  return useQuery({
    queryKey: [ROUND_RANKINGS_KEY, roundId, trackId],
    queryFn: () => rankingApi.getRankings(roundId, trackId),
    enabled: !!roundId,
  });
}

export function useTeamRanking(roundId: string, teamId: string) {
  return useQuery({
    queryKey: [TEAM_RANKING_KEY, roundId, teamId],
    queryFn: () => rankingApi.getTeamRanking(roundId, teamId),
    enabled: !!roundId && !!teamId,
  });
}

export function useAdvancements(roundId: string) {
  return useQuery({
    queryKey: [ROUND_ADVANCEMENTS_KEY, roundId],
    queryFn: () => rankingApi.getAdvancements(roundId),
    enabled: !!roundId,
  });
}

export function usePublishedResults(roundId: string) {
  return useQuery({
    queryKey: [PUBLISHED_RESULTS_KEY, roundId],
    queryFn: () => rankingApi.getPublishedResults(roundId),
    enabled: !!roundId,
  });
}

export function useRecalculateRankings(eventId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roundId: string) => rankingApi.recalculate(roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROUND_RANKINGS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["team-rankings"] });
      queryClient.invalidateQueries({ queryKey: ["season-rankings"] });
      queryClient.invalidateQueries({ queryKey: ["season-leaderboard-enriched"] });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
      }
    },
  });
}
