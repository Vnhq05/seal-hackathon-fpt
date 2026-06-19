export interface InvitationMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export interface InvitationTeamLeader {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  hackathonName: string;
  trackName: string;
  leader: InvitationTeamLeader;
  members: InvitationMember[];
  memberCount: number;
  maxMembers: number;
  message: string | null;
  expiresAt: string | null;
}

export type InvitationAction = "accept" | "decline";

export interface RespondInvitationRequest {
  invitationId: string;
  action: InvitationAction;
}

export interface RespondInvitationResponse {
  message: string;
}
