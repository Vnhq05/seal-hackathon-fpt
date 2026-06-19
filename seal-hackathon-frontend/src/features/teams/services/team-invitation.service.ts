import { apiClient } from "@/lib/axios";
import type {
  TeamInvitation,
  RespondInvitationRequest,
  RespondInvitationResponse,
} from "@/features/teams/types/team-invitation.types";

export async function fetchTeamInvitation(
  invitationId: string,
): Promise<TeamInvitation> {
  const { data } = await apiClient.get<TeamInvitation>(
    `/invitations/${invitationId}`,
  );
  return data;
}

export async function respondToInvitation(
  payload: RespondInvitationRequest,
): Promise<RespondInvitationResponse> {
  const { data } = await apiClient.post<RespondInvitationResponse>(
    `/invitations/${payload.invitationId}/respond`,
    { action: payload.action },
  );
  return data;
}
