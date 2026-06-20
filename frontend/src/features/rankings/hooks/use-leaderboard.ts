import { useQuery } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";
import type { RankingResponse } from "@/lib/api";

export const LEADERBOARD_KEY = "leaderboard" as const;

export function useLeaderboard(roundId: string | undefined) {
  return useQuery({
    queryKey: [LEADERBOARD_KEY, roundId],
    queryFn: (): Promise<RankingResponse[]> => rankingApi.getRankings(roundId!),
    enabled: !!roundId,
  });
}
