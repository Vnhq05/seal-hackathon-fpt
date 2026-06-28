import { api } from "./api-client";

export type TrackAssignmentMethod = "RANDOM" | "MANUAL";

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

export const trackAssignmentApi = {
  assign(eventId: string, body: TrackAssignRequest): Promise<TrackAssignmentResponse[]> {
    return api.post<TrackAssignmentResponse[]>(`/events/${eventId}/tracks/assign`, body);
  },

  draw(eventId: string, body: TrackDrawRequest = { method: "RANDOM" }): Promise<TrackDrawResultResponse> {
    return api.post<TrackDrawResultResponse>(`/events/${eventId}/tracks/draw`, body);
  },
};
