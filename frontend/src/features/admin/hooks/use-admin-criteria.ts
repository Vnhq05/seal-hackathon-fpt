import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { criteriaApi, type CriteriaRequest, type CriteriaResponse } from "@/lib/api";

export const ROUND_CRITERIA_KEY = "round-criteria" as const;

/**
 * List criteria for a specific round.
 * Replaces old criteria-template + event-criteria pattern.
 */
export function useRoundCriteria(roundId: string) {
  return useQuery({
    queryKey: [ROUND_CRITERIA_KEY, roundId],
    queryFn: () => criteriaApi.list(roundId),
    enabled: !!roundId,
  });
}

/** Add a single criterion to a round. */
export function useAddCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriteriaRequest) => criteriaApi.add(roundId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

/** Update an existing criterion in a round. */
export function useUpdateCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ criteriaId, ...body }: CriteriaRequest & { criteriaId: string }) =>
      criteriaApi.update(roundId, criteriaId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

/** Delete a criterion from a round. */
export function useDeleteCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (criteriaId: string) => criteriaApi.delete(roundId, criteriaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

/** Replace all criteria for a round at once. */
export function useReplaceAllCriteria(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CriteriaRequest[]) => criteriaApi.replaceAll(roundId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ROUND_CRITERIA_KEY, roundId] }),
  });
}

// ═══════════════════════════════════════════════
//  Backward-compat aliases (callers should migrate)
// ═══════════════════════════════════════════════

/** @deprecated Criteria templates endpoint does not exist. Returns empty data. */
export function useCriteriaTemplates() {
  return useQuery({
    queryKey: ["criteria-templates-placeholder"],
    queryFn: () =>
      Promise.resolve({ data: [] as CriteriaResponse[], total: 0 }),
  });
}

/** @deprecated Use useAddCriterion instead. This is a no-op placeholder. */
export function useCreateCriteriaTemplate() {
  // TODO: No criteria templates endpoint in the backend
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useCreateCriteriaTemplate] No backend endpoint for criteria templates.");
      return {} as CriteriaResponse;
    },
  });
}

/** @deprecated No backend endpoint. No-op placeholder. */
export function useUpdateCriteriaTemplate() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useUpdateCriteriaTemplate] No backend endpoint for criteria templates.");
      return {} as CriteriaResponse;
    },
  });
}

/** @deprecated No backend endpoint. No-op placeholder. */
export function useDeleteCriteriaTemplate() {
  return useMutation({
    mutationFn: async (_id: string) => {
      console.warn("[useDeleteCriteriaTemplate] No backend endpoint for criteria templates.");
    },
  });
}

/** @deprecated Use useRoundCriteria instead */
export const useEventCriteria = useRoundCriteria;

/** @deprecated Use useReplaceAllCriteria instead. No-op placeholder. */
export function useSaveEventCriteria() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      // TODO: The old save-event-criteria pattern doesn't exist.
      // Callers should use useReplaceAllCriteria(roundId) instead.
      console.warn("[useSaveEventCriteria] No backend endpoint. Use useReplaceAllCriteria.");
      return {} as unknown;
    },
  });
}

/** @deprecated */
export const CRITERIA_TEMPLATES_KEY = "criteria-templates-placeholder" as const;
/** @deprecated */
export const EVENT_CRITERIA_KEY = ROUND_CRITERIA_KEY;
