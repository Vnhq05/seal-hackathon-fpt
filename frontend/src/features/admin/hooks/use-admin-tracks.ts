/**
 * Tracks no longer exist in the backend.
 * The concept has been replaced by **criteria per round**.
 *
 * This file re-exports criteria hooks so that any page still importing
 * "track" hooks compiles. Callers should migrate to use-admin-criteria.ts directly.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { criteriaApi, adminUserApi, type CriteriaRequest, type CriteriaResponse } from "@/lib/api";
import type { UserListItem } from "@/lib/api";

export const ADMIN_CRITERIA_KEY = "admin-criteria" as const;

/**
 * List criteria for a round (replaces old "tracks" listing).
 * @param roundId – the round whose criteria to fetch
 */
export function useAdminCriteria(roundId: string) {
  return useQuery({
    queryKey: [ADMIN_CRITERIA_KEY, roundId],
    queryFn: () => criteriaApi.list(roundId),
    enabled: !!roundId,
  });
}

/** Add a criterion to a round. */
export function useAddCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriteriaRequest) => criteriaApi.add(roundId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_CRITERIA_KEY, roundId] }),
  });
}

/** Update an existing criterion. */
export function useUpdateCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ criteriaId, ...body }: CriteriaRequest & { criteriaId: string }) =>
      criteriaApi.update(roundId, criteriaId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_CRITERIA_KEY, roundId] }),
  });
}

/** Delete a criterion. */
export function useDeleteCriterion(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (criteriaId: string) => criteriaApi.delete(roundId, criteriaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_CRITERIA_KEY, roundId] }),
  });
}

/** Replace all criteria for a round at once. */
export function useReplaceAllCriteria(roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CriteriaRequest[]) => criteriaApi.replaceAll(roundId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_CRITERIA_KEY, roundId] }),
  });
}

// ═══════════════════════════════════════════════
//  Backward-compat aliases (remove once callers are migrated)
// ═══════════════════════════════════════════════

/** @deprecated Tracks no longer exist. Use useAdminCriteria instead. */
export const useAdminTracks = useAdminCriteria;

/** @deprecated Tracks no longer exist. Returns empty placeholder data. */
export function useAdminTrack(_id: string) {
  return useQuery({
    queryKey: ["admin-track-placeholder", _id],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
}

/** @deprecated Tracks no longer exist. No-op placeholder. */
export function useCreateTrack() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useCreateTrack] Tracks no longer exist. Use criteria hooks instead.");
      return {} as unknown;
    },
  });
}

/** @deprecated Tracks no longer exist. No-op placeholder. */
export function useUpdateTrack() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      console.warn("[useUpdateTrack] Tracks no longer exist. Use criteria hooks instead.");
      return {} as unknown;
    },
  });
}

/** @deprecated Tracks no longer exist. No-op placeholder. */
export function useDeleteTrack() {
  return useMutation({
    mutationFn: async (_id: string) => {
      console.warn("[useDeleteTrack] Tracks no longer exist. Use criteria hooks instead.");
    },
  });
}

/**
 * @deprecated Mentor options dropdown. Uses adminUserApi.listUsers to fetch mentors.
 * Returns an array of {id, name, email} for backward compatibility.
 */
export function useMentorOptions() {
  return useQuery({
    queryKey: ["mentor-options"],
    queryFn: async () => {
      const page = await adminUserApi.listUsers({ userType: "LECTURER", status: "ACTIVE", size: 200 });
      return page.content.map((u: UserListItem) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
      }));
    },
  });
}

/** @deprecated */
export const ADMIN_TRACKS_KEY = ADMIN_CRITERIA_KEY;
/** @deprecated */
export const ADMIN_TRACK_KEY = "admin-track-placeholder" as const;
/** @deprecated */
export const MENTOR_OPTIONS_KEY = "mentor-options" as const;
