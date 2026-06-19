import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/features/staff/services/staff.service";
import type { AnnouncementListParams, AnnouncementPayload } from "@/features/staff/types/staff.types";

export const STAFF_ANNOUNCEMENTS_KEY = "staff-announcements" as const;

export function useStaffAnnouncements(params?: AnnouncementListParams) {
  return useQuery({
    queryKey: [STAFF_ANNOUNCEMENTS_KEY, params],
    queryFn: () => fetchAnnouncements(params),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AnnouncementPayload }) => updateAnnouncement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}
