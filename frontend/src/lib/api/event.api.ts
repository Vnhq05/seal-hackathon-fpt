import { api } from "./api-client";
import type { CompetitionFormat, EventStatus, Page, PageParams } from "./types";

export type { CompetitionFormat };
import type { TrackResponse } from "./track.api";
import type { CreateRoundRequest } from "./round.api";

// ═══ Types ═══

export type PrizeRank = "FIRST" | "SECOND" | "THIRD" | "CONSOLATION";

export interface PrizeResponse {
  id: string;
  trackId: string | null;
  rank: PrizeRank;
  value: string;
  quantity: number;
  label?: string | null;
}

export interface HonoredGuestResponse {
  id: string;
  fullName: string;
  title: string | null;
}

export interface EventResponse {
  id: string;
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationOpenDate: string | null;
  status: EventStatus;
  description: string | null;
  location: string | null;
  format: string;
  competitionFormat?: CompetitionFormat;
  minTeam: number | null;
  maxTeam: number | null;
  semesterMin: number | null;
  semesterMax: number | null;
  scoringTemplateId: string | null;
  tiebreakerCriteria: string | null;
  roundCount: number;
  mentorCount: number;
  trackCount: number;
  tracks: TrackResponse[];
  prizes: PrizeResponse[];
  honoredGuests: HonoredGuestResponse[];
  createdAt: string;
}

export interface PrizeRequest {
  trackId?: string;
  trackIndex?: number;
  rank: PrizeRank;
  value: string;
  quantity: number;
  label?: string;
}

export interface HonoredGuestRequest {
  fullName: string;
  title?: string;
}

export interface TrackRequest {
  name: string;
  description?: string;
  topic?: string;
  maxTeams: number;
  scoringTemplateId?: string;
}

export interface CreateEventRequest {
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  description?: string;
  location?: string;
  format?: string;
  competitionFormat?: CompetitionFormat;
  registrationOpenDate?: string;
  minTeam?: number;
  maxTeam?: number;
  semesterMin?: number;
  semesterMax?: number;
  scoringTemplateId?: string;
  tiebreakerCriteria?: string;
  tracks?: TrackRequest[];
  prizes?: PrizeRequest[];
  honoredGuests?: HonoredGuestRequest[];
  mentorUserIds?: string[];
  judgeUserIds?: string[];
}

export type PublishEventRequest = CreateEventRequest & {
  rounds?: CreateRoundRequest[];
};

export type UpdateEventRequest = Omit<CreateEventRequest, "tracks" | "mentorUserIds" | "judgeUserIds">;

export interface EventListParams extends PageParams {
  status?: EventStatus | EventStatus[] | string;
  season?: string;
  year?: number;
}

// ═══ API calls ═══

export const eventApi = {
  create(body: CreateEventRequest): Promise<EventResponse> {
    return api.post<EventResponse>("/events", body);
  },

  publish(body: PublishEventRequest): Promise<EventResponse> {
    return api.post<EventResponse>("/events/publish", body);
  },

  update(eventId: string, body: UpdateEventRequest): Promise<EventResponse> {
    return api.put<EventResponse>(`/events/${eventId}`, body);
  },

  delete(eventId: string): Promise<void> {
    return api.delete<void>(`/events/${eventId}`);
  },

  activate(eventId: string): Promise<EventResponse> {
    return api.post<EventResponse>(`/events/${eventId}/activate`);
  },

  cancel(eventId: string): Promise<EventResponse> {
    return api.post<EventResponse>(`/events/${eventId}/cancel`);
  },

  getById(eventId: string): Promise<EventResponse> {
    return api.get<EventResponse>(`/events/${eventId}`);
  },

  list(params?: EventListParams): Promise<Page<EventResponse>> {
    const query: Record<string, unknown> = { ...params };
    if (Array.isArray(query.status)) {
      query.status = (query.status as EventStatus[]).join(",");
    }
    return api.get<Page<EventResponse>>("/events", { params: query });
  },
};
