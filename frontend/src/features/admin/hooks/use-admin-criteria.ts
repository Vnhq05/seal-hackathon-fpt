import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { criteriaApi, scoringTemplateApi, type CriteriaRequest } from "@/lib/api";
import type { CreateScoringTemplateRequest } from "@/lib/api";

export const ROUND_CRITERIA_KEY = "round-criteria" as const;
export const SCORING_TEMPLATES_KEY = "scoring-templates" as const;

// ═══════════════════════════════════════════════
//  Per-Round Criteria (existing, unchanged)
// ═══════════════════════════════════════════════

export function useRoundCriteria(roundId: string) {
  return useQuery({
    queryKey: [ROUND_CRITERIA_KEY, roundId],
    queryFn: () => criteriaApi.list(roundId),
    enabled: !!roundId,
  });
}

export function useAddCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriteriaRequest) => criteriaApi.add(roundId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

export function useUpdateCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ criteriaId, ...body }: CriteriaRequest & { criteriaId: string }) =>
      criteriaApi.update(roundId, criteriaId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

export function useDeleteCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (criteriaId: string) => criteriaApi.delete(roundId, criteriaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

export function useReplaceAllCriteria(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CriteriaRequest[]) => criteriaApi.replaceAll(roundId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

// ═══════════════════════════════════════════════
//  Scoring Templates (real API)
// ═══════════════════════════════════════════════

export function useCriteriaTemplates() {
  return useQuery({
    queryKey: [SCORING_TEMPLATES_KEY],
    queryFn: () => scoringTemplateApi.list(),
  });
}

export function useCreateCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScoringTemplateRequest) => scoringTemplateApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCORING_TEMPLATES_KEY] }),
  });
}

export function useUpdateCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CreateScoringTemplateRequest & { id: string }) =>
      scoringTemplateApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCORING_TEMPLATES_KEY] }),
  });
}

export function useDeleteCriteriaTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => scoringTemplateApi.delete(templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCORING_TEMPLATES_KEY] }),
  });
}
