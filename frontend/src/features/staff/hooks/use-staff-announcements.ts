import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AnnouncementListParams,
  AnnouncementPayload,
  Announcement,
  PaginatedResponse,
} from "@/features/staff/types/staff.types";

export const STAFF_ANNOUNCEMENTS_KEY = "staff-announcements" as const;

// TODO: backend endpoint not implemented yet — /staff/announcements does not exist.
// No announcements feature exists in the current backend.
export function useStaffAnnouncements(params?: AnnouncementListParams) {
  return useQuery<PaginatedResponse<Announcement>>({
    queryKey: [STAFF_ANNOUNCEMENTS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<Announcement>> => {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      } as unknown as PaginatedResponse<Announcement>;
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: AnnouncementPayload): Promise<Announcement> => {
      throw new Error("Create announcement: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_input: { id: string; payload: AnnouncementPayload }): Promise<Announcement> => {
      throw new Error("Update announcement: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}

// TODO: backend endpoint not implemented yet
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string): Promise<void> => {
      throw new Error("Delete announcement: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_ANNOUNCEMENTS_KEY] });
    },
  });
}
