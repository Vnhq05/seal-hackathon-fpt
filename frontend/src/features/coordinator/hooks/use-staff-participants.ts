import { useQuery } from "@tanstack/react-query";
import { coordinatorUserApi } from "@/lib/api/coordinator-user.api";
import type { ParticipantListParams, Participant, PaginatedResponse } from "@/features/coordinator/types/staff.types";

export const STAFF_PARTICIPANTS_KEY = "staff-participants" as const;

export function useStaffParticipants(params?: ParticipantListParams) {
  return useQuery<PaginatedResponse<Participant>>({
    queryKey: [STAFF_PARTICIPANTS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<Participant>> => {
      const page = await coordinatorUserApi.listUsers({
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
