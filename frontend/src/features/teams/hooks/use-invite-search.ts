import { useQuery } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";

export const INVITE_SEARCH_KEY = "invite-search" as const;

/**
 * The old `/teams/{teamId}/invite/search` endpoint does not exist.
 * This hook now uses `adminUserApi.listUsers({search})` as a fallback
 * to let the UI search for users by name/email.
 */
export function useInviteSearch(teamId: string, search: string) {
  return useQuery({
    queryKey: [INVITE_SEARCH_KEY, teamId, search],
    queryFn: () => adminUserApi.listUsers({ search, size: 20 }),
    enabled: search.length >= 2,
  });
}
