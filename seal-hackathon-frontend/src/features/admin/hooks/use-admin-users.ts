import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
} from "@/features/admin/services/admin-user.service";
import type { AdminUserListParams, UpdateUserRequest } from "@/features/admin/types/admin.types";

export const ADMIN_USERS_KEY = "admin-users" as const;

export function useAdminUsers(params?: AdminUserListParams) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, params],
    queryFn: () => fetchAdminUsers(params),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UpdateUserRequest) => updateUser(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}
