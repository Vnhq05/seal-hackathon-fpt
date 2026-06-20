import { api } from "./api-client";
import type { Page, PageParams } from "./types";
import type { EventResponse } from "./event.api";

export interface PlatformStats {
  activeEventCount: number;
  registeredUserCount: number;
  teamCount: number;
}

export const publicApi = {
  listActiveEvents(params?: PageParams): Promise<Page<EventResponse>> {
    return api.get<Page<EventResponse>>("/public/events", { params });
  },

  getStats(): Promise<PlatformStats> {
    return api.get<PlatformStats>("/public/stats");
  },
};
