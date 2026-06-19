import { useQuery } from "@tanstack/react-query";
import { fetchTeamInvitation } from "@/features/teams/services/team-invitation.service";

export const TEAM_INVITATION_KEY = "team-invitation" as const;

export function useTeamInvitation(invitationId: string) {
  return useQuery({
    queryKey: [TEAM_INVITATION_KEY, invitationId],
    queryFn: () => fetchTeamInvitation(invitationId),
    enabled: !!invitationId,
  });
}
