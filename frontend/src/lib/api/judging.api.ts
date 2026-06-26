import { api } from "./api-client";

// ═══ Types ═══

export type ScoreStatus = "IN_PROGRESS" | "COMPLETED" | "LOCKED";

export interface ScoreDetailDto {
  criteriaId: string;
  score: number;
  comment?: string;
}

export interface ScoreSubmissionRequest {
  submissionId: string;
  scores: ScoreDetailDto[];
  complete?: boolean;
}

export interface ScoreDetailResponse {
  id: string;
  criteriaId: string;
  criteriaName: string;
  score: number;
}

export interface CommentResponse {
  id: string;
  criteriaId: string;
  criteriaName: string;
  comment: string;
}

export interface JudgeScoreResponse {
  id: string;
  judgeUserId: string;
  judgeFullName: string | null;
  submissionId: string;
  roundId: string;
  status: ScoreStatus;
  startedAt: string;
  completedAt: string | null;
  details: ScoreDetailResponse[];
  comments: CommentResponse[];
}

// ═══ API calls ═══

export const judgingApi = {
  submitScore(roundId: string, body: ScoreSubmissionRequest): Promise<JudgeScoreResponse> {
    return api.post<JudgeScoreResponse>(`/rounds/${roundId}/scoring`, body);
  },

  updateScore(roundId: string, judgeScoreId: string, body: ScoreSubmissionRequest): Promise<JudgeScoreResponse> {
    return api.put<JudgeScoreResponse>(`/rounds/${roundId}/scoring/${judgeScoreId}`, body);
  },

  getScoresBySubmission(roundId: string, submissionId: string): Promise<JudgeScoreResponse[]> {
    return api.get<JudgeScoreResponse[]>(`/rounds/${roundId}/scoring/submission/${submissionId}`);
  },

  getScoresByRound(roundId: string): Promise<JudgeScoreResponse[]> {
    return api.get<JudgeScoreResponse[]>(`/rounds/${roundId}/scoring`);
  },

  getMyScores(roundId: string): Promise<JudgeScoreResponse[]> {
    return api.get<JudgeScoreResponse[]>(`/rounds/${roundId}/scoring/my`);
  },

  getMyScoreForSubmission(roundId: string, submissionId: string): Promise<JudgeScoreResponse> {
    return api.get<JudgeScoreResponse>(`/rounds/${roundId}/scoring/my/submission/${submissionId}`);
  },

  getScoreById(roundId: string, judgeScoreId: string): Promise<JudgeScoreResponse> {
    return api.get<JudgeScoreResponse>(`/rounds/${roundId}/scoring/${judgeScoreId}`);
  },

  lockScores(roundId: string): Promise<number> {
    return api.post<number>(`/rounds/${roundId}/scoring/lock`);
  },

  deleteScore(roundId: string, judgeScoreId: string): Promise<void> {
    return api.delete<void>(`/rounds/${roundId}/scoring/${judgeScoreId}`);
  },

  getMyAssignments(): Promise<JudgeScoringAssignment[]> {
    return api.get<JudgeScoringAssignment[]>("/judging/my-assignments");
  },

  getMyScoresHistory(): Promise<JudgeScoreResponse[]> {
    return api.get<JudgeScoreResponse[]>("/judging/my-scores");
  },
};

export interface JudgeScoringAssignment {
  teamId: string;
  teamName: string;
  roundId: string;
  roundName: string;
  eventId: string | null;
  eventName: string | null;
  trackId: string | null;
  trackName: string | null;
  submissionId: string | null;
  scoringStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "LOCKED";
  scoringDeadline: string | null;
}
