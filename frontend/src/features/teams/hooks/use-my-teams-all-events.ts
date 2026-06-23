import { useQuery } from "@tanstack/react-query";
import { eventApi, teamApi } from "@/lib/api";
import type { EventResponse, TeamResponse } from "@/lib/api";

export interface MyEventTeam {
  event: EventResponse;
  team: TeamResponse | null;
}

async function fetchMyTeamsAllEvents(): Promise<MyEventTeam[]> {
  const eventsPage = await eventApi.list({ size: 50 });
  const events = eventsPage.content;

  const results: MyEventTeam[] = [];
  for (const event of events) {
    try {
      const team = await teamApi.getMyTeam(event.id);
      results.push({ event, team });
    } catch {
      results.push({ event, team: null });
    }
  }

  return results.filter((r) => r.team !== null);
}

export function useMyTeamsAllEvents() {
  return useQuery({
    queryKey: ["my-teams-all-events"],
    queryFn: fetchMyTeamsAllEvents,
  });
}
