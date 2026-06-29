import { api } from "./api-client";

export type TrackAssignmentMethod = "RANDOM" | "MANUAL" | "SELF_DRAW";
export type DrawSessionStatus = "OPEN" | "CLOSED";
export type TrackStatus = "OPEN" | "LOCKED";

export interface TrackAssignmentResponse {
  teamId: string;
  trackId: string;
  trackName: string;
  method: TrackAssignmentMethod;
}

export interface TrackAssignRequest {
  assignments: { teamId: string; trackId: string }[];
}

export interface TrackDrawResultResponse {
  assignments: TrackAssignmentResponse[];
  unassignedCount: number;
}

export interface TrackDrawRequest {
  method?: TrackAssignmentMethod;
}

export interface AvailableTrackSlotResponse {
  trackId: string;
  name: string;
  status: TrackStatus;
  remainingSlots: number;
}

export interface TrackDrawSessionResponse {
  sessionId: string;
  eventId: string;
  status: DrawSessionStatus;
  currentTeamId: string | null;
  currentTeamName: string | null;
  currentIndex: number;
  totalTeams: number;
  scheduledAt: string | null;
  openedAt: string | null;
  availableTracks: AvailableTrackSlotResponse[];
}

export interface OpenTrackDrawSessionRequest {
  scheduledAt?: string;
  drawOrder?: string[];
}

export interface TrackLockResponse {
  lockedTrackCount: number;
}

export const trackAssignmentApi = {
  assign(eventId: string, body: TrackAssignRequest): Promise<TrackAssignmentResponse[]> {
    return api.post<TrackAssignmentResponse[]>(`/events/${eventId}/tracks/assign`, body);
  },

  draw(eventId: string, body: TrackDrawRequest = { method: "RANDOM" }): Promise<TrackDrawResultResponse> {
    return api.post<TrackDrawResultResponse>(`/events/${eventId}/tracks/draw`, body);
  },

  openDrawSession(eventId: string, body: OpenTrackDrawSessionRequest = {}): Promise<TrackDrawSessionResponse> {
    return api.post<TrackDrawSessionResponse>(`/events/${eventId}/tracks/draw-session/open`, body);
  },

  getDrawSession(eventId: string): Promise<TrackDrawSessionResponse> {
    return api.get<TrackDrawSessionResponse>(`/events/${eventId}/tracks/draw-session`);
  },

  lockTracks(eventId: string): Promise<TrackLockResponse> {
    return api.post<TrackLockResponse>(`/events/${eventId}/tracks/lock`);
  },
};
