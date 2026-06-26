import { api } from "./api-client";
import type { TeamStatus } from "./types";

export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export interface JoinableTeamResponse {
  id: string;
  name: string;
  leaderId: string;
  leaderEmail: string | null;
  leaderFullName: string | null;
  memberCount: number;
  maxTeamMembers: number;
  status: TeamStatus;
}

export interface TeamJoinRequestResponse {
  id: string;
  teamId: string;
  teamName: string;
  eventId: string;
  requesterId: string;
  requesterFullName: string | null;
  requesterEmail: string | null;
  status: JoinRequestStatus;
  message: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateJoinRequestRequest {
  message?: string;
}

export const joinRequestApi = {
  getJoinable(eventId: string): Promise<JoinableTeamResponse[]> {
    return api.get<JoinableTeamResponse[]>(`/events/${eventId}/teams/joinable`);
  },

  create(eventId: string, teamId: string, body?: CreateJoinRequestRequest): Promise<TeamJoinRequestResponse> {
    return api.post<TeamJoinRequestResponse>(`/events/${eventId}/teams/${teamId}/join-requests`, body ?? {});
  },

  getTeamRequests(eventId: string, teamId: string): Promise<TeamJoinRequestResponse[]> {
    return api.get<TeamJoinRequestResponse[]>(`/events/${eventId}/teams/${teamId}/join-requests`);
  },

  getMyRequests(eventId: string): Promise<TeamJoinRequestResponse[]> {
    return api.get<TeamJoinRequestResponse[]>(`/events/${eventId}/teams/join-requests/my`);
  },

  accept(eventId: string, joinRequestId: string): Promise<TeamJoinRequestResponse> {
    return api.post<TeamJoinRequestResponse>(`/events/${eventId}/teams/join-requests/${joinRequestId}/accept`);
  },

  reject(eventId: string, joinRequestId: string): Promise<TeamJoinRequestResponse> {
    return api.post<TeamJoinRequestResponse>(`/events/${eventId}/teams/join-requests/${joinRequestId}/reject`);
  },

  cancel(eventId: string, joinRequestId: string): Promise<TeamJoinRequestResponse> {
    return api.post<TeamJoinRequestResponse>(`/events/${eventId}/teams/join-requests/${joinRequestId}/cancel`);
  },
};
