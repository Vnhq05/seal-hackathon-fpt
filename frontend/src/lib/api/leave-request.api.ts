import { api } from "./api-client";

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TeamLeaveRequestResponse {
  id: string;
  teamId: string;
  teamName: string;
  eventId: string;
  userId: string;
  userFullName: string | null;
  userEmail: string | null;
  status: LeaveRequestStatus;
  reason: string | null;
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface CreateLeaveRequestRequest {
  reason?: string;
}

export const leaveRequestApi = {
  create(eventId: string, teamId: string, body?: CreateLeaveRequestRequest): Promise<TeamLeaveRequestResponse> {
    return api.post<TeamLeaveRequestResponse>(`/events/${eventId}/teams/${teamId}/leave-requests`, body ?? {});
  },

  getTeamRequests(eventId: string, teamId: string): Promise<TeamLeaveRequestResponse[]> {
    return api.get<TeamLeaveRequestResponse[]>(`/events/${eventId}/teams/${teamId}/leave-requests`);
  },

  getEventRequests(eventId: string): Promise<TeamLeaveRequestResponse[]> {
    return api.get<TeamLeaveRequestResponse[]>(`/events/${eventId}/teams/leave-requests`);
  },

  approve(eventId: string, leaveRequestId: string): Promise<TeamLeaveRequestResponse> {
    return api.put<TeamLeaveRequestResponse>(`/events/${eventId}/teams/leave-requests/${leaveRequestId}/approve`);
  },

  reject(eventId: string, leaveRequestId: string): Promise<TeamLeaveRequestResponse> {
    return api.put<TeamLeaveRequestResponse>(`/events/${eventId}/teams/leave-requests/${leaveRequestId}/reject`);
  },
};
