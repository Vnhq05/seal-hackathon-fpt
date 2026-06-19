import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminRounds,
  fetchAdminRound,
  createRound,
  updateRound,
  deleteRound,
} from "@/features/admin/services/admin-hackathon.service";
import type { CreateRoundRequest, UpdateRoundRequest } from "@/features/admin/types/admin.types";

export const ADMIN_ROUNDS_KEY = "admin-rounds" as const;
export const ADMIN_ROUND_KEY = "admin-round" as const;

export function useAdminRounds(hackathonId?: string) {
  return useQuery({
    queryKey: [ADMIN_ROUNDS_KEY, hackathonId],
    queryFn: () => fetchAdminRounds(hackathonId),
  });
}

export function useAdminRound(id: string) {
  return useQuery({
    queryKey: [ADMIN_ROUND_KEY, id],
    queryFn: () => fetchAdminRound(id),
    enabled: !!id,
  });
}

export function useCreateRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoundRequest) => createRound(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY] }),
  });
}

export function useUpdateRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRoundRequest) => updateRound(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY] }),
  });
}

export function useDeleteRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRound(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_ROUNDS_KEY] }),
  });
}
