import { api } from "./api-client";

export type ScoreReviewStatus =
  | "OPEN"
  | "APPROVED"
  | "ADJUSTED"
  | "REJECTED"
  | "RESOLVED"
  | "IGNORED";

export type ScoreAdjustmentType = "AUTO_DEVIATION" | "JUDGE_REQUESTED";

export type ScoreReviewResolverRole = "SYSTEM_ADMIN" | "EVENT_COORDINATOR" | string;

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
  adjustmentType?: ScoreAdjustmentType;
  requestedBy?: string | null;
  requestedByFullName?: string | null;
  requestNote?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy?: string | null;
  resolvedByRole?: ScoreReviewResolverRole | null;
  resolvedByFullName?: string | null;
  resolutionNote: string | null;
  judgeScores?: ScoreReviewJudgeScore[];
}

export interface ScoreReviewContextResponse {
  reviewId: string | null;
  submissionId: string;
  status: ScoreReviewStatus | null;
  adjustmentType?: ScoreAdjustmentType | null;
  deviationValue: number;
  deviationThreshold: number;
  canRequestAdjustment: boolean;
  canEditForAdjustment: boolean;
  requestNote?: string | null;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  resolvedByRole?: ScoreReviewResolverRole | null;
  resolvedByFullName?: string | null;
}

/** Label for resolution notes shown to judges, based on who closed the request. */
export function scoreReviewNoteLabel(role?: ScoreReviewResolverRole | null): string {
  if (role === "SYSTEM_ADMIN") return "Admin note";
  if (role === "EVENT_COORDINATOR") return "Coordinator note";
  return "Decision note";
}

export interface ResolveScoreReviewRequest {
  status: "RESOLVED" | "REJECTED" | "IGNORED";
  resolutionNote?: string;
}

export interface ApproveScoreAdjustmentRequest {
  resolutionNote?: string;
}

export interface JudgeScoreReviewRequest {
  submissionId: string;
  note: string;
}

/** Backend 409 message when an active review already exists for the submission. */
export const SCORE_REVIEW_ADJUSTMENT_CONFLICT_MESSAGE =
  "A score adjustment request is already active for this submission.";

export const SCORE_REVIEW_DEVIATION_TOO_LOW_MESSAGE =
  "Score deviation is below the threshold required for an adjustment request.";

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

  getSubmissionContext(
    eventId: string,
    submissionId: string,
  ): Promise<ScoreReviewContextResponse> {
    return api.get<ScoreReviewContextResponse>(
      `/events/${eventId}/score-reviews/submission/${submissionId}/context`,
    );
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

  approve(
    eventId: string,
    reviewId: string,
    body?: ApproveScoreAdjustmentRequest,
  ): Promise<ScoreReviewResponse> {
    return api.post<ScoreReviewResponse>(
      `/events/${eventId}/score-reviews/${reviewId}/approve`,
      body ?? {},
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
