import { useQuery } from "@tanstack/react-query";
import { enrollmentApi, eventApi, teamApi } from "@/lib/api";
import type { EventResponse, TeamResponse } from "@/lib/api";

export interface MyEventTeam {
  event: EventResponse;
  team: TeamResponse | null;
}

async function fetchMyTeamsAllEvents(): Promise<MyEventTeam[]> {
  const enrollments = await enrollmentApi.getMyEnrollments();
  const eligible = enrollments.filter(
    (e) => e.status !== "REJECTED" && e.status !== "WITHDRAWN",
  );

  return Promise.all(
    eligible.map(async (enrollment) => {
      const event = await eventApi.getById(enrollment.eventId);
      try {
        // Backend hides disbanded teams here (404) — the student is back on the waiting list.
        const team = await teamApi.getMyTeam(event.id);
        return { event, team };
      } catch {
        return { event, team: null };
      }
    }),
  );
}

export function useMyTeamsAllEvents() {
  return useQuery({
    queryKey: ["my-teams-all-events"],
    queryFn: fetchMyTeamsAllEvents,
  });
}
