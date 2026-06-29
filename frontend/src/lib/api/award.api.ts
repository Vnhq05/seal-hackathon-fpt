import { api } from "./api-client";
import type { PrizeRank } from "./event.api";

export interface TeamAwardResponse {
  id: string;
  eventId: string;
  teamId: string;
  teamName: string;
  prizeId: string;
  prizeRank: PrizeRank;
  prizeLabel: string | null;
  prizeValue: string;
  awardedAt: string;
}

export interface ParticipationCertificateResponse {
  id: string;
  eventId: string;
  userId: string;
  teamId: string;
  userFullName: string | null;
  teamName: string | null;
  issuedAt: string;
}

export interface ParticipationCertificateSummaryResponse {
  eventId: string;
  issuedCount: number;
}

export interface AwardAssignmentResultResponse {
  teamAwards: TeamAwardResponse[];
  participationCertificatesIssued: number;
  participationCertificates: ParticipationCertificateResponse[];
}

export const awardApi = {
  assign(eventId: string): Promise<AwardAssignmentResultResponse> {
    return api.post<AwardAssignmentResultResponse>(`/events/${eventId}/awards/assign`);
  },

  list(eventId: string): Promise<TeamAwardResponse[]> {
    return api.get<TeamAwardResponse[]>(`/events/${eventId}/awards`);
  },

  listPublic(eventId: string): Promise<TeamAwardResponse[]> {
    return api.get<TeamAwardResponse[]>(`/public/events/${eventId}/awards`);
  },

  listParticipation(eventId: string): Promise<ParticipationCertificateResponse[]> {
    return api.get<ParticipationCertificateResponse[]>(
      `/events/${eventId}/awards/participation`,
    );
  },

  listParticipationPublic(eventId: string): Promise<ParticipationCertificateSummaryResponse> {
    return api.get<ParticipationCertificateSummaryResponse>(
      `/public/events/${eventId}/awards/participation`,
    );
  },

  getMyParticipation(eventId: string): Promise<ParticipationCertificateResponse> {
    return api.get<ParticipationCertificateResponse>(
      `/events/${eventId}/awards/participation/me`,
    );
  },

  async getMyParticipationOptional(
    eventId: string,
  ): Promise<ParticipationCertificateResponse | null> {
    try {
      return await awardApi.getMyParticipation(eventId);
    } catch {
      return null;
    }
  },
};
