import { api } from "./api-client";
import type { PrizeRank } from "./event.api";

export interface TeamAwardResponse {
  id: string;
  eventId: string;
  teamId: string;
  teamName: string;
  prizeId: string;
  prizeRank: PrizeRank;
  prizeLabel: string | null;
  prizeValue: string;
  awardedAt: string;
}

export const awardApi = {
  assign(eventId: string): Promise<TeamAwardResponse[]> {
    return api.post<TeamAwardResponse[]>(`/events/${eventId}/awards/assign`);
  },

  list(eventId: string): Promise<TeamAwardResponse[]> {
    return api.get<TeamAwardResponse[]>(`/events/${eventId}/awards`);
  },

  listPublic(eventId: string): Promise<TeamAwardResponse[]> {
    return api.get<TeamAwardResponse[]>(`/public/events/${eventId}/awards`);
  },
};
