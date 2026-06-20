import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";
import type { UserListParams, ApprovalRequest } from "@/lib/api";

export const ADMIN_USERS_KEY = "admin-users" as const;

export function useAdminUsers(params?: UserListParams) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, params],
    queryFn: () => adminUserApi.listUsers(params),
  });
}

export function useApproveOrReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ApprovalRequest) => adminUserApi.approveOrReject(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, "pending-count"],
    queryFn: () => adminUserApi.countPending(),
  });
}
