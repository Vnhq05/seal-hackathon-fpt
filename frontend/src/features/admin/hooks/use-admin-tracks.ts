import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackApi, type CreateTrackRequest } from "@/lib/api";
import { ADMIN_EVENT_KEY } from "@/features/admin/hooks/use-admin-hackathons";

export const ADMIN_TRACKS_KEY = "admin-tracks" as const;

export function useAdminTracks(eventId: string) {
  return useQuery({
    queryKey: [ADMIN_TRACKS_KEY, eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });
}

export function useCreateTrack(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrackRequest) => trackApi.create(eventId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
      qc.invalidateQueries({ queryKey: [ADMIN_EVENT_KEY, eventId] });
    },
  });
}

export function useUpdateTrack(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackId, ...body }: CreateTrackRequest & { trackId: string }) =>
      trackApi.update(eventId, trackId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
      qc.invalidateQueries({ queryKey: [ADMIN_EVENT_KEY, eventId] });
    },
  });
}

export function useDeleteTrack(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string) => trackApi.delete(eventId, trackId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_TRACKS_KEY, eventId] });
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
      qc.invalidateQueries({ queryKey: [ADMIN_EVENT_KEY, eventId] });
    },
  });
}
