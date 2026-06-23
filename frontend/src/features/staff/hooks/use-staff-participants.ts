import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api/admin-user.api";
import type { ParticipantListParams, Participant, PaginatedResponse } from "@/features/staff/types/staff.types";

export const STAFF_PARTICIPANTS_KEY = "staff-participants" as const;

/**
 * Fetches participants using adminUserApi.listUsers() filtered to student types.
 * Maps from lib/api Page<UserListItem> to the component's PaginatedResponse<Participant>.
 */
export function useStaffParticipants(params?: ParticipantListParams) {
  return useQuery<PaginatedResponse<Participant>>({
    queryKey: [STAFF_PARTICIPANTS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<Participant>> => {
      const page = await adminUserApi.listUsers({
        page: params?.page ? params.page - 1 : 0,
        size: params?.pageSize ?? 10,
        search: params?.search,
        status: "ACTIVE",
      });

      const items = page.content.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        userType: u.userType,
        status: u.status,
        createdAt: u.createdAt,
      })) as unknown as Participant[];

      return {
        data: items,
        total: page.totalElements,
        page: page.number + 1,
        pageSize: page.size,
        totalPages: page.totalPages,
      } as unknown as PaginatedResponse<Participant>;
    },
  });
}

// TODO: backend endpoint not implemented yet — /staff/students/:id/deactivate does not exist.
export function useDeactivateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_participantId: string): Promise<void> => {
      // No equivalent endpoint in current backend
      console.warn("Deactivate participant: backend endpoint not implemented yet");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_PARTICIPANTS_KEY] });
    },
  });
}
