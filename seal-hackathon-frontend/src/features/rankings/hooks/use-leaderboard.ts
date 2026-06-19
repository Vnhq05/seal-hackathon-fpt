import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/features/rankings/services/leaderboard.service";
import type { LeaderboardParams } from "@/features/rankings/types/leaderboard.types";

export const LEADERBOARD_KEY = "leaderboard" as const;

export function useLeaderboard(params?: LeaderboardParams) {
  return useQuery({
    queryKey: [LEADERBOARD_KEY, params?.track],
    queryFn: () => fetchLeaderboard(params),
  });
}
