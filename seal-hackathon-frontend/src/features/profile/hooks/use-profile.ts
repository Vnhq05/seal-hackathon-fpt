import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/features/profile/services/profile.service";

export const PROFILE_QUERY_KEY = "profile" as const;

export function useProfile() {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY],
    queryFn: fetchMyProfile,
  });
}
