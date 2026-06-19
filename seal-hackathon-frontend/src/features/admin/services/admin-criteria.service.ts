import { apiClient } from "@/lib/axios";
import type {
  CriteriaTemplateListResponse,
  CriteriaTemplate,
  CreateCriteriaTemplateRequest,
  UpdateCriteriaTemplateRequest,
  EventCriteriaConfig,
  SaveEventCriteriaRequest,
} from "@/features/admin/types/admin-analytics.types";

export async function fetchCriteriaTemplates(): Promise<CriteriaTemplateListResponse> {
  const { data } = await apiClient.get<CriteriaTemplateListResponse>("/admin/criteria-templates");
  return data;
}

export async function fetchCriteriaTemplate(id: string): Promise<CriteriaTemplate> {
  const { data } = await apiClient.get<CriteriaTemplate>(`/admin/criteria-templates/${id}`);
  return data;
}

export async function createCriteriaTemplate(
  payload: CreateCriteriaTemplateRequest,
): Promise<CriteriaTemplate> {
  const { data } = await apiClient.post<CriteriaTemplate>("/admin/criteria-templates", payload);
  return data;
}

export async function updateCriteriaTemplate(
  payload: UpdateCriteriaTemplateRequest,
): Promise<CriteriaTemplate> {
  const { id, ...rest } = payload;
  const { data } = await apiClient.put<CriteriaTemplate>(`/admin/criteria-templates/${id}`, rest);
  return data;
}

export async function deleteCriteriaTemplate(id: string): Promise<void> {
  await apiClient.delete(`/admin/criteria-templates/${id}`);
}

/* ── Event criteria config ── */

export async function fetchEventCriteria(
  hackathonId: string,
  roundId: string,
): Promise<EventCriteriaConfig> {
  const { data } = await apiClient.get<EventCriteriaConfig>("/admin/event-criteria", {
    params: { hackathonId, roundId },
  });
  return data;
}

export async function saveEventCriteria(
  payload: SaveEventCriteriaRequest,
): Promise<EventCriteriaConfig> {
  const { data } = await apiClient.post<EventCriteriaConfig>("/admin/event-criteria", payload);
  return data;
}
