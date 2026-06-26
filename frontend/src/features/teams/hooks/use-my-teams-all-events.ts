import { useQuery } from "@tanstack/react-query";
import { enrollmentApi, eventApi, teamApi } from "@/lib/api";
import type { EventResponse, TeamResponse } from "@/lib/api";

export interface MyEventTeam {
  event: EventResponse;
  team: TeamResponse | null;
}

async function fetchMyTeamsAllEvents(): Promise<MyEventTeam[]> {
  const enrollment = await enrollmentApi.getMyActiveEnrollment();
  if (!enrollment || enrollment.status === "REJECTED" || enrollment.status === "WITHDRAWN") {
    return [];
  }

  const event = await eventApi.getById(enrollment.eventId);
  try {
    const team = await teamApi.getMyTeam(event.id);
    return [{ event, team }];
  } catch {
    return [{ event, team: null }];
  }
}

export function useMyTeamsAllEvents() {
  return useQuery({
    queryKey: ["my-teams-all-events"],
    queryFn: fetchMyTeamsAllEvents,
  });
}
