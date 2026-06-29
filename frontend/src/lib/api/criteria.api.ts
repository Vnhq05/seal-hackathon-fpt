import { api } from "./api-client";

// ═══ Types ═══

export interface CriteriaResponse {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
  minScore: number;
  maxScore: number;
}

export interface CriteriaRequest {
  name: string;
  description?: string;
  weight: number;
  sortOrder?: number;
  minScore?: number;
  maxScore?: number;
}

// ═══ API calls ═══

export const criteriaApi = {
  list(roundId: string): Promise<CriteriaResponse[]> {
    return api.get<CriteriaResponse[]>(`/rounds/${roundId}/criteria`);
  },

  add(roundId: string, body: CriteriaRequest): Promise<CriteriaResponse> {
    return api.post<CriteriaResponse>(`/rounds/${roundId}/criteria`, body);
  },

  update(roundId: string, criteriaId: string, body: CriteriaRequest): Promise<CriteriaResponse> {
    return api.put<CriteriaResponse>(`/rounds/${roundId}/criteria/${criteriaId}`, body);
  },

  delete(roundId: string, criteriaId: string): Promise<void> {
    return api.delete<void>(`/rounds/${roundId}/criteria/${criteriaId}`);
  },

  replaceAll(roundId: string, body: CriteriaRequest[]): Promise<CriteriaResponse[]> {
    return api.put<CriteriaResponse[]>(`/rounds/${roundId}/criteria`, body);
  },
};
