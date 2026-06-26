import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";
import type { UserListParams, ApprovalRequest, CreateInternalAccountRequest } from "@/lib/api";

export const ADMIN_USERS_KEY = "admin-users" as const;
export const LECTURER_OPTIONS_KEY = "lecturer-options" as const;

export function useAdminUsers(params?: UserListParams) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, params],
    queryFn: () => adminUserApi.listUsers(params),
  });
}

export function useApproveOrReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: ApprovalRequest) =>
      req.action === "APPROVE"
        ? adminUserApi.approveUser(req.userId)
        : adminUserApi.approveOrReject({
            ...req,
            reason: req.reason?.trim() || "Rejected by administrator",
          }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, "pending-count"],
    queryFn: () => adminUserApi.countPending(),
  });
}

export function useCreateInternalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateInternalAccountRequest) => adminUserApi.createInternalAccount(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

function invalidateUserLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
  qc.invalidateQueries({ queryKey: [LECTURER_OPTIONS_KEY] });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminUserApi.deactivateUser(userId),
    onSuccess: () => invalidateUserLists(qc),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminUserApi.deleteUser(userId),
    onSuccess: () => invalidateUserLists(qc),
  });
}
