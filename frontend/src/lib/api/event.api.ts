import { api } from "./api-client";
import type { EventStatus, Page, PageParams } from "./types";

// ═══ Types ═══

export interface EventResponse {
  id: string;
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: EventStatus;
  roundCount: number;
  mentorCount: number;
  createdAt: string;
}

export interface CreateEventRequest {
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
}

export type UpdateEventRequest = CreateEventRequest;

export interface EventListParams extends PageParams {
  status?: EventStatus;
}

// ═══ API calls ═══

export const eventApi = {
  create(body: CreateEventRequest): Promise<EventResponse> {
    return api.post<EventResponse>("/events", body);
  },

  update(eventId: string, body: UpdateEventRequest): Promise<EventResponse> {
    return api.put<EventResponse>(`/events/${eventId}`, body);
  },

  activate(eventId: string): Promise<EventResponse> {
    return api.post<EventResponse>(`/events/${eventId}/activate`);
  },

  complete(eventId: string): Promise<EventResponse> {
    return api.post<EventResponse>(`/events/${eventId}/complete`);
  },

  cancel(eventId: string): Promise<EventResponse> {
    return api.post<EventResponse>(`/events/${eventId}/cancel`);
  },

  getById(eventId: string): Promise<EventResponse> {
    return api.get<EventResponse>(`/events/${eventId}`);
  },

  list(params?: EventListParams): Promise<Page<EventResponse>> {
    return api.get<Page<EventResponse>>("/events", { params });
  },
};
