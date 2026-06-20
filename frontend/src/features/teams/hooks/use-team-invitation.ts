import { useQuery } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";

export const TEAM_INVITATION_KEY = "team-invitation" as const;

/**
 * Fetches the current user's pending invitations and optionally filters
 * to a single invitation by ID.
 *
 * When `invitationId` is provided the query returns the matching
 * InvitationResponse (or undefined). When omitted it returns the full array.
 */
export function useTeamInvitation(invitationId?: string) {
  return useQuery({
    queryKey: [TEAM_INVITATION_KEY, invitationId],
    queryFn: async () => {
      const invitations = await invitationApi.getMyPending();
      if (invitationId) {
        return invitations.find((inv) => inv.id === invitationId) ?? null;
      }
      return invitations;
    },
    enabled: invitationId ? !!invitationId : true,
  });
}
