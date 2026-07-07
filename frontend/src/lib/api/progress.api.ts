import { api } from "./api-client";

export type ProgressRiskReason =
  | "NOT_STARTED"
  | "SLIDE_ONLY_PAST_GATE"
  | "SINGLE_VERSION_LAST_MINUTE"
  | "STALLED"
  | "MISSING_ATTACHMENT";

export type ProgressRiskLevel = "OK" | "AT_RISK" | "CRITICAL";

export interface TeamProgressResponse {
  teamId: string;
  teamName: string;
  roundId: string;
  riskLevel: ProgressRiskLevel;
  reasons: ProgressRiskReason[];
  lastSubmittedAt: string | null;
  totalVersions: number;
  hoursUntilDeadline: number;
}

export const progressApi = {
  getByRound(eventId: string, roundId: string): Promise<TeamProgressResponse[]> {
    return api.get<TeamProgressResponse[]>(
      `/events/${eventId}/rounds/${roundId}/progress`,
    );
  },

  getMentorAtRisk(eventId: string): Promise<TeamProgressResponse[]> {
    return api.get<TeamProgressResponse[]>("/mentor/teams/at-risk", {
      params: { eventId },
    });
  },
};
