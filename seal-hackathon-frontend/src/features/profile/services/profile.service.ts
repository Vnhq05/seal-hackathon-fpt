import { apiClient } from "@/lib/axios";
import type {
  UserProfile,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UploadAvatarResponse,
} from "@/features/profile/types/profile.types";

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/profile/me");
  return data;
}

export async function updateMyProfile(
  payload: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.put<UpdateProfileResponse>("/profile/me", payload);
  return data;
}

export async function changeMyPassword(
  payload: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.put<ChangePasswordResponse>("/profile/password", payload);
  return data;
}

export async function uploadMyAvatar(file: File): Promise<UploadAvatarResponse> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<UploadAvatarResponse>("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
