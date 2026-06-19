import { api } from "./api-client";
import type { AdvancementStatus, DisputeStatus } from "./types";

// ═══ Types ═══

export interface RankingResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  roundId: string;
  finalScore: number;
  rank: number;
  version: number;
  calculatedAt: string;
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

  publishResults(roundId: string): Promise<PublishedResultResponse> {
    return api.post<PublishedResultResponse>(`/rounds/${roundId}/results/publish`);
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
