import { apiClient } from "@/lib/axios";
import type {
  LeaderboardParams,
  LeaderboardResponse,
} from "@/features/rankings/types/leaderboard.types";

export async function fetchLeaderboard(
  params?: LeaderboardParams,
): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get<LeaderboardResponse>("/leaderboard", {
    params,
  });
  return data;
}

export async function downloadRankingCsv(track?: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>("/leaderboard/export", {
    params: track ? { track } : undefined,
    responseType: "blob",
  });
  return data;
}
