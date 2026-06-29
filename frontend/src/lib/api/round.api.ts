import { api } from "./api-client";
import type { CriteriaResponse } from "./criteria.api";
import type { RoundType } from "./types";

export type { RoundType };

export type AdvancementRule = "GLOBAL_TOP_N" | "PER_TRACK_TOP_N" | "FINALIST_POOL" | "NONE";

// ═══ Types ═══

export interface RoundResponse {
  id: string;
  eventId: string;
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  slideDeadline?: string | null;
  scoringDeadline: string;
  advancementCutoff: number;
  roundWeight?: number;
  roundType: RoundType | null;
  advancementRule?: AdvancementRule | null;
  criteria: CriteriaResponse[];
  judgeCount: number;
}

export interface CreateRoundRequest {
  roundNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  slideDeadline?: string | null;
  scoringDeadline: string;
  advancementCutoff: number;
  roundWeight?: number;
  roundType?: RoundType;
  advancementRule?: AdvancementRule;
}

// ═══ API calls ═══

export const roundApi = {
  create(eventId: string, body: CreateRoundRequest): Promise<RoundResponse> {
    return api.post<RoundResponse>(`/events/${eventId}/rounds`, body);
  },

  list(eventId: string): Promise<RoundResponse[]> {
    return api.get<RoundResponse[]>(`/events/${eventId}/rounds`);
  },

  getById(eventId: string, roundId: string): Promise<RoundResponse> {
    return api.get<RoundResponse>(`/events/${eventId}/rounds/${roundId}`);
  },

  update(eventId: string, roundId: string, body: CreateRoundRequest): Promise<RoundResponse> {
    return api.put<RoundResponse>(`/events/${eventId}/rounds/${roundId}`, body);
  },

  delete(eventId: string, roundId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/rounds/${roundId}`);
  },

  reopenScoring(eventId: string, roundId: string, newDeadline: string): Promise<RoundResponse> {
    return api.post<RoundResponse>(
      `/events/${eventId}/rounds/${roundId}/reopen-scoring`,
      JSON.stringify(newDeadline),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
