import { api } from "./api-client";

// ═══ Types ═══

export interface RankingResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  roundId: string;
  roundName: string | null;
  trackId: string | null;
  trackName: string | null;
  finalScore: number;
  rank: number;
  version: number;
  calculatedAt: string;
}

export interface EventRankingBoard {
  eventId: string;
  eventName: string;
  season: string;
  year: number;
  roundId: string;
  roundName: string;
  tracks: { id: string; name: string; description?: string | null; maxTeams: number; eventId: string; scoringTemplateId?: string | null }[];
  rankings: RankingResponse[];
}

export interface AdvancementResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  roundId: string;
  status: "ADVANCED" | "ELIMINATED";
  rank: number | null;
  finalScore: number | null;
}

export interface PublishedResultResponse {
  id: string;
  roundId: string;
  publishedBy: string;
  publishedAt: string;
  disputeDeadline: string;
  rankings: RankingResponse[];
  advancements: AdvancementResponse[];
}

export interface DisputeRequest {
  reason: string;
}

export interface ResolveDisputeRequest {
  action: "RESOLVE" | "REJECT";
  resolution: string;
}

export interface DisputeResponse {
  id: string;
  teamId: string;
  roundId: string;
  filedBy: string;
  reason: string;
  status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  filedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: string | null;
}

// ═══ API calls ═══

export const rankingApi = {
  getSeasonRankings(params?: { season?: string; year?: number; trackId?: string }): Promise<EventRankingBoard[]> {
    return api.get<EventRankingBoard[]>("/ranking", { params });
  },

  getRankings(roundId: string): Promise<RankingResponse[]> {
    return api.get<RankingResponse[]>(`/rounds/${roundId}/rankings`);
  },

  getTeamRanking(roundId: string, teamId: string): Promise<RankingResponse> {
    return api.get<RankingResponse>(`/rounds/${roundId}/rankings/team/${teamId}`);
  },

  recalculate(roundId: string): Promise<RankingResponse[]> {
    return api.post<RankingResponse[]>(`/rounds/${roundId}/rankings/recalculate`);
  },

  getAdvancements(roundId: string): Promise<AdvancementResponse[]> {
    return api.get<AdvancementResponse[]>(`/rounds/${roundId}/rankings/advancements`);
  },

  getPublishedResults(roundId: string): Promise<PublishedResultResponse> {
    return api.get<PublishedResultResponse>(`/rounds/${roundId}/results`);
  },

  fileDispute(roundId: string, body: DisputeRequest): Promise<DisputeResponse> {
    return api.post<DisputeResponse>(`/rounds/${roundId}/disputes`, body);
  },

  getDisputes(roundId: string): Promise<DisputeResponse[]> {
    return api.get<DisputeResponse[]>(`/rounds/${roundId}/disputes`);
  },

  getDisputeById(roundId: string, disputeId: string): Promise<DisputeResponse> {
    return api.get<DisputeResponse>(`/rounds/${roundId}/disputes/${disputeId}`);
  },

  resolveDispute(roundId: string, disputeId: string, body: ResolveDisputeRequest): Promise<DisputeResponse> {
    return api.post<DisputeResponse>(`/rounds/${roundId}/disputes/${disputeId}/resolve`, body);
  },
};
