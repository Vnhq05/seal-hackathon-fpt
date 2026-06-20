import { useQuery } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";

export const TEAM_RANKINGS_KEY = "team-rankings" as const;

/**
 * Fetches rankings for a specific round.
 * The old hook called `/teams/rankings` with no parameters;
 * the backend requires a roundId via `GET /rounds/{roundId}/rankings`.
 */
export function useTeamRankings(roundId: string) {
  return useQuery({
    queryKey: [TEAM_RANKINGS_KEY, roundId],
    queryFn: () => rankingApi.getRankings(roundId),
    enabled: !!roundId,
  });
}
