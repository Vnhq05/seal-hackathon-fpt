import { apiClient } from "@/lib/axios";
import type {
  JudgeDashboard,
  AssignedRoundsResponse,
  RoundSubmissionsParams,
  RoundSubmissionsResponse,
  SubmissionForScoring,
  SubmitScoresPayload,
  SubmitScoresResponse,
  ScoreHistoryResponse,
} from "@/features/judging/types/judge.types";

export async function fetchJudgeDashboard(): Promise<JudgeDashboard> {
  const { data } = await apiClient.get<JudgeDashboard>("/judge/dashboard");
  return data;
}

export async function fetchAssignedRounds(): Promise<AssignedRoundsResponse> {
  const { data } = await apiClient.get<AssignedRoundsResponse>("/judge/rounds");
  return data;
}

export async function fetchRoundSubmissions(
  roundId: string,
  params?: RoundSubmissionsParams,
): Promise<RoundSubmissionsResponse> {
  const { data } = await apiClient.get<RoundSubmissionsResponse>(
    `/judge/rounds/${roundId}/submissions`,
    { params },
  );
  return data;
}

export async function fetchSubmissionForScoring(
  submissionId: string,
): Promise<SubmissionForScoring> {
  const { data } = await apiClient.get<SubmissionForScoring>(
    `/judge/submissions/${submissionId}/scoring`,
  );
  return data;
}

export async function submitScores(
  payload: SubmitScoresPayload,
): Promise<SubmitScoresResponse> {
  const { data } = await apiClient.post<SubmitScoresResponse>(
    `/judge/submissions/${payload.submissionId}/scores`,
    { scores: payload.scores },
  );
  return data;
}

export async function saveScoringDraft(
  payload: SubmitScoresPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    `/judge/submissions/${payload.submissionId}/scores/draft`,
    { scores: payload.scores },
  );
  return data;
}

export async function fetchScoreHistory(): Promise<ScoreHistoryResponse> {
  const { data } =
    await apiClient.get<ScoreHistoryResponse>("/judge/score-history");
  return data;
}
