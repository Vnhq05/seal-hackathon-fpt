import { useQuery } from "@tanstack/react-query";
import { searchInviteCandidates } from "@/features/teams/services/invite.service";

export const INVITE_SEARCH_KEY = "invite-search" as const;

export function useInviteSearch(teamId: string, search: string) {
  return useQuery({
    queryKey: [INVITE_SEARCH_KEY, teamId, search],
    queryFn: () => searchInviteCandidates({ teamId, search }),
    enabled: search.length >= 2,
  });
}
