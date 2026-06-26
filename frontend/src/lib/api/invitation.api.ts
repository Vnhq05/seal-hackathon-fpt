import { api } from "./api-client";
import type { InvitationStatus } from "./types";

// ═══ Types ═══

export interface InvitationResponse {
  id: string;
  teamId: string;
  teamName: string;
  inviterId: string;
  inviteeEmail: string;
  status: InvitationStatus;
  expiresAt: string | null;
  createdAt: string;
}

export interface SendInvitationRequest {
  inviteeEmail: string;
}

// ═══ API calls ═══

export const invitationApi = {
  send(teamId: string, body: SendInvitationRequest): Promise<InvitationResponse> {
    return api.post<InvitationResponse>(`/invitations/teams/${teamId}`, body);
  },

  accept(invitationId: string): Promise<InvitationResponse> {
    return api.post<InvitationResponse>(`/invitations/${invitationId}/accept`);
  },

  reject(invitationId: string): Promise<InvitationResponse> {
    return api.post<InvitationResponse>(`/invitations/${invitationId}/reject`);
  },

  cancel(invitationId: string): Promise<InvitationResponse> {
    return api.post<InvitationResponse>(`/invitations/${invitationId}/cancel`);
  },

  getMyPending(): Promise<InvitationResponse[]> {
    return api.get<InvitationResponse[]>("/invitations/my");
  },

  getTeamInvitations(teamId: string): Promise<InvitationResponse[]> {
    return api.get<InvitationResponse[]>(`/invitations/teams/${teamId}`);
  },
};
