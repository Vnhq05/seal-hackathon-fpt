import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCriteriaTemplates,
  createCriteriaTemplate,
  updateCriteriaTemplate,
  deleteCriteriaTemplate,
  fetchEventCriteria,
  saveEventCriteria,
} from "@/features/admin/services/admin-criteria.service";
import type {
  CreateCriteriaTemplateRequest,
  UpdateCriteriaTemplateRequest,
  SaveEventCriteriaRequest,
} from "@/features/admin/types/admin-analytics.types";

export const CRITERIA_TEMPLATES_KEY = "criteria-templates" as const;
export const EVENT_CRITERIA_KEY = "event-criteria" as const;

export function useCriteriaTemplates() {
  return useQuery({
    queryKey: [CRITERIA_TEMPLATES_KEY],
    queryFn: fetchCriteriaTemplates,
  });
}

export function useCreateCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCriteriaTemplateRequest) => createCriteriaTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRITERIA_TEMPLATES_KEY] }),
  });
}

export function useUpdateCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCriteriaTemplateRequest) => updateCriteriaTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRITERIA_TEMPLATES_KEY] }),
  });
}

export function useDeleteCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCriteriaTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRITERIA_TEMPLATES_KEY] }),
  });
}

export function useEventCriteria(hackathonId: string, roundId: string) {
  return useQuery({
    queryKey: [EVENT_CRITERIA_KEY, hackathonId, roundId],
    queryFn: () => fetchEventCriteria(hackathonId, roundId),
    enabled: !!hackathonId && !!roundId,
  });
}

export function useSaveEventCriteria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveEventCriteriaRequest) => saveEventCriteria(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EVENT_CRITERIA_KEY] }),
  });
}
