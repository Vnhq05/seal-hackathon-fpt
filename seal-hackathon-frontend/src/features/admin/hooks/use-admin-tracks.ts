import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminTracks,
  fetchAdminTrack,
  createTrack,
  updateTrack,
  deleteTrack,
  fetchMentorOptions,
} from "@/features/admin/services/admin-hackathon.service";
import type { CreateTrackRequest, UpdateTrackRequest } from "@/features/admin/types/admin.types";

export const ADMIN_TRACKS_KEY = "admin-tracks" as const;
export const ADMIN_TRACK_KEY = "admin-track" as const;
export const MENTOR_OPTIONS_KEY = "mentor-options" as const;

export function useAdminTracks(hackathonId?: string) {
  return useQuery({
    queryKey: [ADMIN_TRACKS_KEY, hackathonId],
    queryFn: () => fetchAdminTracks(hackathonId),
  });
}

export function useAdminTrack(id: string) {
  return useQuery({
    queryKey: [ADMIN_TRACK_KEY, id],
    queryFn: () => fetchAdminTrack(id),
    enabled: !!id,
  });
}

export function useMentorOptions() {
  return useQuery({
    queryKey: [MENTOR_OPTIONS_KEY],
    queryFn: fetchMentorOptions,
  });
}

export function useCreateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrackRequest) => createTrack(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY] }),
  });
}

export function useUpdateTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTrackRequest) => updateTrack(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY] }),
  });
}

export function useDeleteTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrack(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY] }),
  });
}
