import { api } from "./api-client";
import type { Page, PageParams } from "./types";
import type { EventResponse } from "./event.api";
import type { RoundResponse } from "./round.api";

export interface PlatformStats {
  activeEventCount: number;
  registeredUserCount: number;
  teamCount: number;
}

export const publicApi = {
  listActiveEvents(params?: PageParams): Promise<Page<EventResponse>> {
    return api.get<Page<EventResponse>>("/public/events", { params });
  },

  getEventById(eventId: string): Promise<EventResponse> {
    return api.get<EventResponse>(`/public/events/${eventId}`);
  },

  getRounds(eventId: string): Promise<RoundResponse[]> {
    return api.get<RoundResponse[]>(`/public/events/${eventId}/rounds`);
  },

  getStats(): Promise<PlatformStats> {
    return api.get<PlatformStats>("/public/stats");
  },
};
