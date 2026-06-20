import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roundApi, type CreateRoundRequest } from "@/lib/api";

export const ADMIN_ROUNDS_KEY = "admin-rounds" as const;
export const ADMIN_ROUND_KEY = "admin-round" as const;

/**
 * List rounds for a specific event.
 * The backend requires eventId (rounds are nested under /events/{eventId}/rounds).
 */
export function useAdminRounds(eventId: string) {
  return useQuery({
    queryKey: [ADMIN_ROUNDS_KEY, eventId],
    queryFn: () => roundApi.list(eventId),
    enabled: !!eventId,
  });
}

/** Fetch a single round by eventId + roundId. */
export function useAdminRound(eventId: string, roundId: string) {
  return useQuery({
    queryKey: [ADMIN_ROUND_KEY, eventId, roundId],
    queryFn: () => roundApi.getById(eventId, roundId),
    enabled: !!eventId && !!roundId,
  });
}

/** Create a round under a specific event. */
export function useCreateRound(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoundRequest) => roundApi.create(eventId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY, eventId] }),
  });
}

/** Update an existing round. */
export function useUpdateRound(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId, ...body }: CreateRoundRequest & { roundId: string }) =>
      roundApi.update(eventId, roundId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY, eventId] }),
  });
}

/** Delete a round. */
export function useDeleteRound(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roundId: string) => roundApi.delete(eventId, roundId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY, eventId] }),
  });
}
