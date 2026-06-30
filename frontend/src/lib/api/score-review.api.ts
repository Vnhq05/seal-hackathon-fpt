import { api } from "./api-client";

export type ScoreReviewStatus = "OPEN" | "RESOLVED" | "IGNORED";

export interface ScoreReviewJudgeScore {
  judgeUserId: string;
  judgeFullName: string | null;
  weightedScore: number;
  percentScore: number;
  status: string;
}

export interface ScoreReviewResponse {
  id: string;
  eventId: string;
  roundId: string;
  roundType: "PRELIMINARY" | "FINAL" | null;
  teamId: string;
  teamName: string;
  submissionId: string;
  deviationValue: number;
  minJudgeScore: number;
  maxJudgeScore: number;
  status: ScoreReviewStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  judgeScores?: ScoreReviewJudgeScore[];
}

export interface ResolveScoreReviewRequest {
  status: "RESOLVED" | "IGNORED";
  resolutionNote?: string;
}

export interface JudgeScoreReviewRequest {
  submissionId: string;
  note: string;
}

/** Backend 409 message when an OPEN review already exists for the submission. */
export const SCORE_REVIEW_ADJUSTMENT_CONFLICT_MESSAGE =
  "A deviation review is already open for this submission.";

export const scoreReviewApi = {
  list(
    eventId: string,
    params?: { roundId?: string; status?: ScoreReviewStatus },
  ): Promise<ScoreReviewResponse[]> {
    const search = new URLSearchParams();
    if (params?.roundId) search.set("roundId", params.roundId);
    if (params?.status) search.set("status", params.status);
    const qs = search.toString();
    return api.get<ScoreReviewResponse[]>(
      `/events/${eventId}/score-reviews${qs ? `?${qs}` : ""}`,
    );
  },

  getById(eventId: string, reviewId: string): Promise<ScoreReviewResponse> {
    return api.get<ScoreReviewResponse>(`/events/${eventId}/score-reviews/${reviewId}`);
  },

  resolve(
    eventId: string,
    reviewId: string,
    body: ResolveScoreReviewRequest,
  ): Promise<ScoreReviewResponse> {
    return api.patch<ScoreReviewResponse>(
      `/events/${eventId}/score-reviews/${reviewId}`,
      body,
    );
  },

  requestAdjustment(
    eventId: string,
    body: JudgeScoreReviewRequest,
  ): Promise<ScoreReviewResponse> {
    return api.post<ScoreReviewResponse>(
      `/events/${eventId}/score-reviews/judge-request`,
      body,
    );
  },
};
