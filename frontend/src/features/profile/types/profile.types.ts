// Re-export canonical types from lib/api
export type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/lib/api/user.api";

export type { UserType, AccountStatus } from "@/lib/api/types";

export type ProfileTab = "personal" | "security" | "events";
