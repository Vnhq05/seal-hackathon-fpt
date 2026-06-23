import { api } from "./api-client";

// ═══ Types ═══

export interface ScoringTemplateCriterionResponse {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

export interface ScoringTemplateResponse {
  id: string;
  name: string;
  description: string | null;
  criteria: ScoringTemplateCriterionResponse[];
  createdAt: string;
}

export interface CriterionRequest {
  name: string;
  description?: string;
  weight: number;
  sortOrder?: number;
}

export interface CreateScoringTemplateRequest {
  name: string;
  description?: string;
  criteria: CriterionRequest[];
}

// ═══ API calls ═══

export const scoringTemplateApi = {
  list(): Promise<ScoringTemplateResponse[]> {
    return api.get<ScoringTemplateResponse[]>("/admin/scoring-templates");
  },

  getById(templateId: string): Promise<ScoringTemplateResponse> {
    return api.get<ScoringTemplateResponse>(`/admin/scoring-templates/${templateId}`);
  },

  create(body: CreateScoringTemplateRequest): Promise<ScoringTemplateResponse> {
    return api.post<ScoringTemplateResponse>("/admin/scoring-templates", body);
  },

  update(templateId: string, body: CreateScoringTemplateRequest): Promise<ScoringTemplateResponse> {
    return api.put<ScoringTemplateResponse>(`/admin/scoring-templates/${templateId}`, body);
  },

  delete(templateId: string): Promise<void> {
    return api.delete<void>(`/admin/scoring-templates/${templateId}`);
  },
};
