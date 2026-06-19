import type { UserRole, UserType } from "@/features/auth/types/auth.types";

export type ProfileTab = "personal" | "security" | "events";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  userType: UserType;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  studentId: string | null;
  university: string | null;
  status: "approved" | "pending" | "rejected";
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  bio?: string;
  phone?: string;
  studentId?: string;
  university?: string;
}

export interface UpdateProfileResponse {
  profile: UserProfile;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}
