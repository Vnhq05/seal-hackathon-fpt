import { api } from "./api-client";

export interface FinalistResponse {
  id: string;
  eventId: string;
  teamId: string;
  teamName: string;
  trackId: string | null;
  trackName: string | null;
  preliminaryRank: number;
  selectedReason: string | null;
  selectedAt: string;
}

export const finalistApi = {
  select(eventId: string): Promise<FinalistResponse[]> {
    return api.post<FinalistResponse[]>(`/events/${eventId}/finalists/select`);
  },

  list(eventId: string): Promise<FinalistResponse[]> {
    return api.get<FinalistResponse[]>(`/events/${eventId}/finalists`);
  },
};
