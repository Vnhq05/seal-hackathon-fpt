import { api } from "./api-client";
import type { MentorAssignmentResponse } from "./assignment.api";

// ═══ Types ═══

export type MentorInvitationStatus = "PENDING" | "ACCEPTED" | "DENIED";

export interface MentorInvitationResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  eventId: string;
  mentorUserId: string;
  mentorEmail: string | null;
  mentorName: string | null;
  status: MentorInvitationStatus;
  message: string | null;
  createdAt: string;
}

export interface SendMentorInvitationRequest {
  mentorUserId: string;
  message?: string;
}

export interface RespondMentorInvitationRequest {
  decision: "ACCEPTED" | "DENIED";
}

export interface MentorRoomResponse {
  id: string;
  teamId: string;
  teamName: string | null;
  eventId: string;
  mentorUserId: string;
  createdAt: string;
}

// ═══ API calls ═══

export const mentorInvitationApi = {
  send(eventId: string, teamId: string, body: SendMentorInvitationRequest): Promise<MentorInvitationResponse> {
    return api.post<MentorInvitationResponse>(`/events/${eventId}/mentor-invitations`, { ...body, teamId });
  },

  getByTeam(eventId: string, teamId: string): Promise<MentorInvitationResponse[]> {
    return api.get<MentorInvitationResponse[]>(`/events/${eventId}/mentor-invitations/team/${teamId}`);
  },

  getAvailableMentors(eventId: string): Promise<MentorAssignmentResponse[]> {
    return api.get<MentorAssignmentResponse[]>(`/events/${eventId}/mentor-invitations/available-mentors`);
  },

  getPendingForMentor(eventId: string): Promise<MentorInvitationResponse[]> {
    return api.get<MentorInvitationResponse[]>(`/events/${eventId}/mentor-invitations/pending`);
  },

  getAllPendingForMentor(): Promise<MentorInvitationResponse[]> {
    return api.get<MentorInvitationResponse[]>(`/mentor-invitations/pending`);
  },

  respond(eventId: string, invitationId: string, body: RespondMentorInvitationRequest): Promise<MentorInvitationResponse> {
    return api.put<MentorInvitationResponse>(`/events/${eventId}/mentor-invitations/${invitationId}/respond`, body);
  },

  getRoomByTeam(eventId: string, teamId: string): Promise<MentorRoomResponse | null> {
    return api.get<MentorRoomResponse | null>(`/events/${eventId}/teams/${teamId}/mentor-room`).catch(() => null);
  },

  getMentorActiveRooms(eventId: string): Promise<MentorRoomResponse[]> {
    return api.get<MentorRoomResponse[]>(`/events/${eventId}/mentor-rooms`);
  },

  getAllMentorActiveRooms(): Promise<MentorRoomResponse[]> {
    return api.get<MentorRoomResponse[]>(`/mentor-rooms`);
  },
};
