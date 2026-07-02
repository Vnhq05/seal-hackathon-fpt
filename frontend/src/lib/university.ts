import type { UserType } from "@/lib/api/types";

export const FPT_UNIVERSITY_NAME = "FPT University";

export function resolveUniversityName(
  userType: UserType | undefined,
  universityName: string | null | undefined,
): string | null {
  const trimmed = universityName?.trim();
  if (trimmed) return trimmed;
  if (userType === "FPT_STUDENT") return FPT_UNIVERSITY_NAME;
  return null;
}

export function formatUniversityDisplay(
  userType: UserType | undefined,
  universityName: string | null | undefined,
  fallback = "Not provided",
): string {
  return resolveUniversityName(userType, universityName) ?? fallback;
}
