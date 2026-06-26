import { api } from "./api-client";
import type { UserType, AccountStatus } from "./types";

// ═══ Response types ═══

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  studentId: string | null;
  universityName: string | null;
  userType: UserType;
  status: AccountStatus;
  temporaryAccount?: boolean;
  createdAt: string;
}

// ═══ Request types ═══

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetOfficialPasswordRequest {
  newPassword: string;
}

export interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
}

// ═══ API calls ═══

export const userApi = {
  getMyProfile(): Promise<UserProfile> {
    return api.get<UserProfile>("/users/me");
  },

  updateMyProfile(body: UpdateProfileRequest): Promise<UserProfile> {
    return api.put<UserProfile>("/users/me", body);
  },

  changePassword(body: ChangePasswordRequest): Promise<void> {
    return api.put<void>("/users/me/password", body);
  },

  setOfficialPassword(body: SetOfficialPasswordRequest): Promise<UserProfile> {
    return api.put<UserProfile>("/users/me/official-password", body);
  },

  search(q: string, limit = 20): Promise<UserSearchResult[]> {
    return api.get<UserSearchResult[]>("/users/search", { params: { q, limit } });
  },
};
