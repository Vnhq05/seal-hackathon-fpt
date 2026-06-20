export type InviteUserStatus = "available" | "in_team" | "sent";

export interface InviteCandidate {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: InviteUserStatus;
}

export interface InviteSearchParams {
  teamId: string;
  search: string;
}

export interface InviteSearchResponse {
  data: InviteCandidate[];
}

export type PendingInviteStatus = "pending" | "declined";

export interface PendingInvite {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  sentAt: string;
  status: PendingInviteStatus;
}

export interface PendingInvitesResponse {
  data: PendingInvite[];
}

export interface SendInviteRequest {
  teamId: string;
  userId: string;
}

export interface SendInviteResponse {
  inviteId: string;
  message: string;
}

export interface CancelInviteRequest {
  teamId: string;
  inviteId: string;
}

export interface CancelInviteResponse {
  message: string;
}
