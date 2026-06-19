import { apiClient } from "@/lib/axios";
import type { TeamRankingsResponse } from "@/features/teams/types/team-ranking.types";

export async function fetchTeamRankings(): Promise<TeamRankingsResponse> {
  const { data } = await apiClient.get<TeamRankingsResponse>("/teams/rankings");
  return data;
}
