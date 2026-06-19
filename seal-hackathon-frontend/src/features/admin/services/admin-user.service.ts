import { apiClient } from "@/lib/axios";
import type {
  AdminUserListResponse,
  AdminUserListParams,
  AdminUser,
  UpdateUserRequest,
} from "@/features/admin/types/admin.types";

export async function fetchAdminUsers(
  params?: AdminUserListParams,
): Promise<AdminUserListResponse> {
  const { data } = await apiClient.get<AdminUserListResponse>("/admin/users", { params });
  return data;
}

export async function updateUser(payload: UpdateUserRequest): Promise<AdminUser> {
  const { id, ...rest } = payload;
  const { data } = await apiClient.put<AdminUser>(`/admin/users/${id}`, rest);
  return data;
}

export async function suspendUser(id: string): Promise<void> {
  await apiClient.patch(`/admin/users/${id}/suspend`);
}

export async function activateUser(id: string): Promise<void> {
  await apiClient.patch(`/admin/users/${id}/activate`);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}
