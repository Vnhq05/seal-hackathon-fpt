import { useQuery } from "@tanstack/react-query";
import { fetchPendingUsers } from "@/features/staff/services/staff.service";

export const PENDING_USERS_KEY = "pending-users" as const;

export function usePendingUsers(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: [PENDING_USERS_KEY, params],
    queryFn: () => fetchPendingUsers(params),
  });
}
