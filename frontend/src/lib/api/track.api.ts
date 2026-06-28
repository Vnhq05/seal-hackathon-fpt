import { api } from "./api-client";

// ═══ Types ═══

export interface TrackResponse {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  topic?: string | null;
  maxTeams: number;
  scoringTemplateId: string | null;
}

export interface CreateTrackRequest {
  name: string;
  description?: string;
  maxTeams: number;
  scoringTemplateId?: string;
}

// ═══ API calls ═══

export const trackApi = {
  list(eventId: string): Promise<TrackResponse[]> {
    return api.get<TrackResponse[]>(`/events/${eventId}/tracks`);
  },

  getById(eventId: string, trackId: string): Promise<TrackResponse> {
    return api.get<TrackResponse>(`/events/${eventId}/tracks/${trackId}`);
  },

  create(eventId: string, body: CreateTrackRequest): Promise<TrackResponse> {
    return api.post<TrackResponse>(`/events/${eventId}/tracks`, body);
  },

  update(eventId: string, trackId: string, body: CreateTrackRequest): Promise<TrackResponse> {
    return api.put<TrackResponse>(`/events/${eventId}/tracks/${trackId}`, body);
  },

  delete(eventId: string, trackId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}/tracks/${trackId}`);
  },
};
