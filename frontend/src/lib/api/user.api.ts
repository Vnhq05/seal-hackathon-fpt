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
};
