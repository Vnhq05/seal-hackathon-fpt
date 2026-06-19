import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminHackathons,
  fetchAdminHackathon,
  createHackathon,
  updateHackathon,
  archiveHackathon,
} from "@/features/admin/services/admin-hackathon.service";
import type { CreateHackathonRequest, UpdateHackathonRequest } from "@/features/admin/types/admin.types";

export const ADMIN_HACKATHONS_KEY = "admin-hackathons" as const;
export const ADMIN_HACKATHON_KEY = "admin-hackathon" as const;

export function useAdminHackathons() {
  return useQuery({
    queryKey: [ADMIN_HACKATHONS_KEY],
    queryFn: fetchAdminHackathons,
  });
}

export function useAdminHackathon(id: string) {
  return useQuery({
    queryKey: [ADMIN_HACKATHON_KEY, id],
    queryFn: () => fetchAdminHackathon(id),
    enabled: !!id,
  });
}

export function useCreateHackathon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHackathonRequest) => createHackathon(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_HACKATHONS_KEY] }),
  });
}

export function useUpdateHackathon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateHackathonRequest) => updateHackathon(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_HACKATHONS_KEY] }),
  });
}

export function useArchiveHackathon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveHackathon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_HACKATHONS_KEY] }),
  });
}
