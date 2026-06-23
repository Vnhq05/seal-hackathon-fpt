import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eventApi,
  type CreateEventRequest,
  type UpdateEventRequest,
  type EventListParams,
} from "@/lib/api";

export const ADMIN_EVENTS_KEY = "admin-events" as const;
export const ADMIN_EVENT_KEY = "admin-event" as const;

export function useAdminEvents(params?: EventListParams) {
  return useQuery({
    queryKey: [ADMIN_EVENTS_KEY, params],
    queryFn: () => eventApi.list(params),
  });
}

export function useAdminEvent(eventId: string) {
  return useQuery({
    queryKey: [ADMIN_EVENT_KEY, eventId],
    queryFn: () => eventApi.getById(eventId),
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventRequest) => eventApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ...body }: UpdateEventRequest & { eventId: string }) =>
      eventApi.update(eventId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] }),
  });
}

export function useActivateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventApi.activate(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-active-events"] });
    },
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventApi.cancel(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-active-events"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventApi.delete(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_EVENTS_KEY] });
      qc.invalidateQueries({ queryKey: ["admin-active-events"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });
}

// ── Backward-compat aliases ──
/** @deprecated Use useAdminEvents instead */
export const useAdminHackathons = useAdminEvents;
/** @deprecated Use useAdminEvent instead */
export const useAdminHackathon = useAdminEvent;
/** @deprecated Use useCreateEvent instead */
export const useCreateHackathon = useCreateEvent;
/** @deprecated Use useUpdateEvent instead */
export const useUpdateHackathon = useUpdateEvent;
/** @deprecated Use useCancelEvent instead */
export const useArchiveHackathon = useCancelEvent;
/** @deprecated */
export const ADMIN_HACKATHONS_KEY = ADMIN_EVENTS_KEY;
/** @deprecated */
export const ADMIN_HACKATHON_KEY = ADMIN_EVENT_KEY;
