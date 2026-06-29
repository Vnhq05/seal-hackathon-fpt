import { api } from "./api-client";

export type ScheduleType =
  | "WORKSHOP"
  | "OPENING"
  | "TRACK_DRAW"
  | "MILESTONE"
  | "SCORING"
  | "FINAL"
  | "CEREMONY";

export type ScheduleGate = "SLIDE_SUBMISSION" | "DEMO_SUBMISSION";

export interface EventScheduleResponse {
  id: string;
  eventId: string;
  type: ScheduleType;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  gate: ScheduleGate | null;
  sortOrder: number;
}

export const scheduleApi = {
  list(eventId: string): Promise<EventScheduleResponse[]> {
    return api.get<EventScheduleResponse[]>(`/events/${eventId}/schedule`);
  },

  async getById(eventId: string, scheduleId: string): Promise<EventScheduleResponse | null> {
    const items = await scheduleApi.list(eventId);
    return items.find((s) => s.id === scheduleId) ?? null;
  },
};
