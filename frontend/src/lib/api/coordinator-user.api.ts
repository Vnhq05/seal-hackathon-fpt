import { api } from "./api-client";
import type { UserType, AccountStatus, Page, PageParams } from "./types";
import type { UserProfile } from "./user.api";

// ═══ Types ═══

export interface CoordinatorUserListItem {
  id: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  schoolName?: string | null;
  userType: UserType;
  status: AccountStatus;
  createdAt: string;
}

export interface CoordinatorUserListParams extends PageParams {
  status?: AccountStatus;
  search?: string;
}

export interface RejectAccountRequest {
  reason: string;
}

// ═══ API calls ═══

export const coordinatorUserApi = {
  listUsers(params?: CoordinatorUserListParams): Promise<Page<CoordinatorUserListItem>> {
    return api.get<Page<CoordinatorUserListItem>>("/coordinator/users", { params });
  },

  getPendingAccounts(params?: PageParams): Promise<Page<CoordinatorUserListItem>> {
    return api.get<Page<CoordinatorUserListItem>>("/coordinator/users/pending", { params });
  },

  countPending(): Promise<number> {
    return api.get<number>("/coordinator/users/pending/count");
  },

  approveUser(userId: string): Promise<UserProfile> {
    return api.patch<UserProfile>(`/coordinator/users/${userId}/approve`);
  },

  rejectUser(userId: string, body: RejectAccountRequest): Promise<UserProfile> {
    return api.patch<UserProfile>(`/coordinator/users/${userId}/reject`, body);
  },
};
