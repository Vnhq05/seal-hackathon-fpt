import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";

export const PROFILE_QUERY_KEY = "profile" as const;

export function useProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY],
    queryFn: () => userApi.getMyProfile(),
    enabled: options?.enabled ?? true,
  });
}
