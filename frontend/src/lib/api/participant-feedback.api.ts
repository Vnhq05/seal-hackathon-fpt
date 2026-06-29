import { api } from "./api-client";

export interface ParticipantFeedbackResponse {
  id: string;
  eventId: string;
  userId: string;
  userFullName: string | null;
  teamId: string;
  teamName: string | null;
  overallRating: number;
  comment: string | null;
  submittedAt: string;
}

export interface ParticipantFeedbackSummaryResponse {
  eventId: string;
  totalCount: number;
  averageRating: number | null;
  ratingDistribution: Record<string, number>;
}

export interface SubmitParticipantFeedbackRequest {
  overallRating: number;
  comment?: string;
}

export const participantFeedbackApi = {
  submit(
    eventId: string,
    body: SubmitParticipantFeedbackRequest,
  ): Promise<ParticipantFeedbackResponse> {
    return api.post<ParticipantFeedbackResponse>(
      `/events/${eventId}/participant-feedback`,
      body,
    );
  },

  getMine(eventId: string): Promise<ParticipantFeedbackResponse> {
    return api.get<ParticipantFeedbackResponse>(
      `/events/${eventId}/participant-feedback/me`,
    );
  },

  list(eventId: string): Promise<ParticipantFeedbackResponse[]> {
    return api.get<ParticipantFeedbackResponse[]>(
      `/events/${eventId}/participant-feedback`,
    );
  },

  getSummary(eventId: string): Promise<ParticipantFeedbackSummaryResponse> {
    return api.get<ParticipantFeedbackSummaryResponse>(
      `/events/${eventId}/participant-feedback/summary`,
    );
  },
};
