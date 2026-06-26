import { api } from "./api-client";
import type { TeamStatus, TeamMemberRole, Page, PageParams } from "./types";

// ═══ Types ═══

export interface TeamMemberResponse {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: TeamMemberRole;
  joinedAt: string;
}

export interface TeamResponse {
  id: string;
  eventId: string;
  name: string;
  leaderId: string;
  status: TeamStatus;
  trackId: string | null;
  memberCount: number;
  minTeamMembers: number;
  maxTeamMembers: number;
  canSelectTrack: boolean;
  members: TeamMemberResponse[];
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
  eventId: string;
}

export interface JoinTeamRequest {
  teamId: string;
}

export interface AssignMentorTeamRequest {
  mentorUserId: string;
  teamId: string;
}

// ═══ API calls ═══

export const teamApi = {
  create(eventId: string, body: { name: string }): Promise<TeamResponse> {
    return api.post<TeamResponse>(`/events/${eventId}/teams`, body);
  },

  join(eventId: string, body: JoinTeamRequest): Promise<TeamResponse> {
    return api.post<TeamResponse>(`/events/${eventId}/teams/join`, body);
  },

  list(eventId: string, params?: PageParams): Promise<Page<TeamResponse>> {
    return api.get<Page<TeamResponse>>(`/events/${eventId}/teams`, { params });
  },

  getMyTeam(eventId: string): Promise<TeamResponse> {
    return api.get<TeamResponse>(`/events/${eventId}/teams/my-team`);
  },

  getById(eventId: string, teamId: string): Promise<TeamResponse> {
    return api.get<TeamResponse>(`/events/${eventId}/teams/${teamId}`);
  },

  updateName(eventId: string, teamId: string, body: { name: string }): Promise<TeamResponse> {
    return api.put<TeamResponse>(`/events/${eventId}/teams/${teamId}`, body);
  },

  removeMember(eventId: string, teamId: string, memberId: string): Promise<TeamResponse> {
    return api.delete<TeamResponse>(`/events/${eventId}/teams/${teamId}/members/${memberId}`);
  },

  leaveTeam(eventId: string, teamId: string): Promise<void> {
    return api.post<void>(`/events/${eventId}/teams/${teamId}/leave`);
  },

  transferLeadership(eventId: string, teamId: string, newLeaderId: string): Promise<TeamResponse> {
    return api.put<TeamResponse>(`/events/${eventId}/teams/${teamId}/leader/${newLeaderId}`);
  },

  selectTrack(eventId: string, teamId: string, body: { trackId: string }): Promise<TeamResponse> {
    return api.put<TeamResponse>(`/events/${eventId}/teams/${teamId}/track`, body);
  },

  assignMentorToTeam(eventId: string, body: AssignMentorTeamRequest): Promise<void> {
    return api.post<void>(`/events/${eventId}/teams/mentor-team`, body);
  },

  removeMentorFromTeam(eventId: string, assignmentId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/teams/mentor-team/${assignmentId}`);
  },
};
