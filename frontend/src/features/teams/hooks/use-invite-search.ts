import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user.api";

export const INVITE_SEARCH_KEY = "invite-search" as const;

export function useInviteSearch(_teamId: string, search: string) {
  return useQuery({
    queryKey: [INVITE_SEARCH_KEY, search],
    queryFn: () => userApi.search(search),
    enabled: search.length >= 2,
  });
}
