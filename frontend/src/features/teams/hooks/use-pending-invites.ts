import { useQuery } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";

export const PENDING_INVITES_KEY = "pending-invites" as const;

export function usePendingInvites(teamId: string) {
  return useQuery({
    queryKey: [PENDING_INVITES_KEY, teamId],
    queryFn: () => invitationApi.getTeamInvitations(teamId),
    enabled: !!teamId,
  });
}
