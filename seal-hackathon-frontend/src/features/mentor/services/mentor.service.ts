import { apiClient } from "@/lib/axios";
import type {
  MentorSummaryResponse,
  MentorTeamsParams,
  MentorTeamsResponse,
  MentorTeamDetailResponse,
  SaveMentorNotesRequest,
  SaveMentorNotesResponse,
  MentorActivitiesResponse,
} from "@/features/mentor/types/mentor.types";

export async function fetchMentorSummary(): Promise<MentorSummaryResponse> {
  const { data } = await apiClient.get<MentorSummaryResponse>(
    "/mentor/summary",
  );
  return data;
}

export async function fetchMentorTeams(
  params?: MentorTeamsParams,
): Promise<MentorTeamsResponse> {
  const { data } = await apiClient.get<MentorTeamsResponse>("/mentor/teams", {
    params,
  });
  return data;
}

export async function fetchMentorTeamDetail(
  teamId: string,
): Promise<MentorTeamDetailResponse> {
  const { data } = await apiClient.get<MentorTeamDetailResponse>(
    `/mentor/teams/${teamId}`,
  );
  return data;
}

export async function saveMentorNotes(
  payload: SaveMentorNotesRequest,
): Promise<SaveMentorNotesResponse> {
  const { data } = await apiClient.post<SaveMentorNotesResponse>(
    `/mentor/submissions/${payload.submissionId}/notes`,
    { notes: payload.notes },
  );
  return data;
}

export async function fetchMentorActivities(): Promise<MentorActivitiesResponse> {
  const { data } = await apiClient.get<MentorActivitiesResponse>(
    "/mentor/activities",
  );
  return data;
}

export async function exportTeamsCsv(trackId: string): Promise<Blob> {
  const response = await apiClient.get(`/mentor/teams/export`, {
    params: { trackId },
    responseType: "blob",
  });
  return response.data as Blob;
}
