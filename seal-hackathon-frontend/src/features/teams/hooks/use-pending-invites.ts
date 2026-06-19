import { useQuery } from "@tanstack/react-query";
import { fetchPendingInvites } from "@/features/teams/services/invite.service";

export const PENDING_INVITES_KEY = "pending-invites" as const;

export function usePendingInvites(teamId: string) {
  return useQuery({
    queryKey: [PENDING_INVITES_KEY, teamId],
    queryFn: () => fetchPendingInvites(teamId),
  });
}
