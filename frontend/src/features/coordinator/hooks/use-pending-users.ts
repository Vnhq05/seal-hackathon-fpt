import { useQuery } from "@tanstack/react-query";
import { coordinatorUserApi } from "@/lib/api/coordinator-user.api";
import type { PaginatedResponse, PendingUser } from "@/features/coordinator/types/staff.types";

export const PENDING_USERS_KEY = "pending-users" as const;

export function usePendingUsers(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery<PaginatedResponse<PendingUser>>({
    queryKey: [PENDING_USERS_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<PendingUser>> => {
      const page = await coordinatorUserApi.getPendingAccounts({
        page: params?.page ? params.page - 1 : 0,
        size: params?.pageSize ?? 10,
      });

      let items = page.content.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        userType: u.userType,
        status: u.status,
        createdAt: u.createdAt,
      })) as unknown as PendingUser[];

      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (u) =>
            (u as unknown as { fullName: string }).fullName?.toLowerCase().includes(q) ||
            (u as unknown as { email: string }).email?.toLowerCase().includes(q),
        );
      }

      return {
        data: items,
        total: page.totalElements,
        page: page.number + 1,
        pageSize: page.size,
        totalPages: page.totalPages,
      } as unknown as PaginatedResponse<PendingUser>;
    },
  });
}
