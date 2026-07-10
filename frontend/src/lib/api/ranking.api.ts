import { api } from "./api-client";
import type { AdvancementStatus, RoundType } from "./types";

export type PublishedAdvancementStatus = Extract<AdvancementStatus, "ADVANCED" | "ELIMINATED">;

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
  roundType: RoundType | null;
  tracks: { id: string; name: string; description?: string | null; maxTeams: number; eventId: string; scoringTemplateId?: string | null }[];
  rankings: RankingResponse[];
}

export interface AdvancementResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  roundId: string;
  status: PublishedAdvancementStatus;
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

// ═══ API calls ═══

export const rankingApi = {
  getSeasonRankings(params?: {
    season?: string;
    year?: number;
    trackId?: string;
    roundType?: RoundType;
  }): Promise<EventRankingBoard[]> {
    return api.get<EventRankingBoard[]>("/ranking", { params });
  },

  getRankings(roundId: string, trackId?: string): Promise<RankingResponse[]> {
    return api.get<RankingResponse[]>(`/rounds/${roundId}/rankings`, {
      params: trackId ? { trackId } : undefined,
    });
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
};
