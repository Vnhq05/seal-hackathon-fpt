import { apiClient } from "@/lib/axios";
import type {
  TeamsListParams,
  TeamsListResponse,
  MyTeamResponse,
  TracksResponse,
  TeamDetailResponse,
} from "@/features/teams/types/team.types";

export async function fetchTeams(
  params?: TeamsListParams,
): Promise<TeamsListResponse> {
  const { data } = await apiClient.get<TeamsListResponse>("/teams", { params });
  return data;
}

export async function fetchMyTeam(): Promise<MyTeamResponse> {
  const { data } = await apiClient.get<MyTeamResponse>("/teams/me");
  return data;
}

export async function fetchTracks(): Promise<TracksResponse> {
  const { data } = await apiClient.get<TracksResponse>("/teams/tracks");
  return data;
}

export async function fetchTeamDetail(
  teamId: string,
): Promise<TeamDetailResponse> {
  const { data } = await apiClient.get<TeamDetailResponse>(
    `/teams/${teamId}`,
  );
  return data;
}
