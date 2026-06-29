import { useRoundRankings } from "@/features/rankings/hooks/use-ranking";

export const TEAM_RANKINGS_KEY = "team-rankings" as const;

/**
 * Fetches rankings for a specific round.
 * The old hook called `/teams/rankings` with no parameters;
 * the backend requires a roundId via `GET /rounds/{roundId}/rankings`.
 */
export function useTeamRankings(roundId: string, trackId?: string) {
  return useRoundRankings(roundId, trackId);
}
