import { api } from "./api-client";
import type { UserType, AccountStatus, Page, PageParams } from "./types";
import type { UserProfile } from "./user.api";

// ═══ Types ═══

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  studentId?: string | null;
  schoolName?: string | null;
  userType: UserType;
  status: AccountStatus;
  createdAt: string;
}

export interface UserListParams extends PageParams {
  status?: AccountStatus;
  userType?: UserType;
  search?: string;
}

export interface UserAchievement {
  id: string;
  type: "TEAM_AWARD" | "PARTICIPATION_CERTIFICATE";
  eventId: string;
  eventName: string | null;
  teamId: string;
  teamName: string | null;
  prizeRank: "FIRST" | "SECOND" | "THIRD" | "CONSOLATION" | null;
  title: string;
  description: string | null;
  achievedAt: string;
}

export interface ApprovalRequest {
  userId: string;
  action: "APPROVE" | "REJECT";
  reason?: string;
}

export interface CreateInternalAccountRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  userType: Extract<UserType, "LECTURER" | "EVENT_COORDINATOR" | "SYSTEM_ADMIN">;
}

// ═══ API calls ═══

export const adminUserApi = {
  listUsers(params?: UserListParams): Promise<Page<UserListItem>> {
    return api.get<Page<UserListItem>>("/admin/users", { params });
  },

  getPendingAccounts(params?: PageParams): Promise<Page<UserListItem>> {
    return api.get<Page<UserListItem>>("/admin/users/pending", { params });
  },

  countPending(): Promise<number> {
    return api.get<number>("/admin/users/pending/count");
  },

  getUserById(userId: string): Promise<UserProfile> {
    return api.get<UserProfile>(`/admin/users/${userId}`);
  },

  getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return api.get<UserAchievement[]>(`/admin/users/${userId}/achievements`);
  },

  approveUser(userId: string): Promise<UserProfile> {
    return api.patch<UserProfile>(`/admin/users/${userId}/approve`);
  },

  approveOrReject(body: ApprovalRequest): Promise<UserProfile> {
    return api.post<UserProfile>("/admin/users/approve", body);
  },

  createInternalAccount(body: CreateInternalAccountRequest): Promise<UserProfile> {
    return api.post<UserProfile>("/admin/users", body);
  },

  deactivateUser(userId: string): Promise<UserProfile> {
    return api.patch<UserProfile>(`/admin/users/${userId}/deactivate`);
  },

  reactivateUser(userId: string): Promise<UserProfile> {
    return api.patch<UserProfile>(`/admin/users/${userId}/reactivate`);
  },

  deleteUser(userId: string): Promise<void> {
    return api.delete<void>(`/admin/users/${userId}`);
  },
};
