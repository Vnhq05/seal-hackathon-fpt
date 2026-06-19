import { apiClient } from "@/lib/axios";
import type {
  SubmitProjectRequest,
  SubmitProjectResponse,
  RoundInfo,
  GitHubRepoInfo,
} from "@/features/submissions/types/submit-project.types";

export async function submitProject(
  payload: SubmitProjectRequest,
): Promise<SubmitProjectResponse> {
  const { data } = await apiClient.post<SubmitProjectResponse>(
    "/submissions",
    payload,
  );
  return data;
}

export async function saveProjectDraft(
  payload: SubmitProjectRequest,
): Promise<SubmitProjectResponse> {
  const { data } = await apiClient.post<SubmitProjectResponse>(
    "/submissions/draft",
    payload,
  );
  return data;
}

export async function fetchRoundInfo(
  hackathonId: string,
): Promise<RoundInfo> {
  const { data } = await apiClient.get<RoundInfo>(
    `/hackathons/${hackathonId}/current-round`,
  );
  return data;
}

export async function fetchGitHubRepoInfo(
  repoUrl: string,
): Promise<GitHubRepoInfo> {
  const { data } = await apiClient.get<GitHubRepoInfo>(
    "/submissions/github-info",
    { params: { url: repoUrl } },
  );
  return data;
}
