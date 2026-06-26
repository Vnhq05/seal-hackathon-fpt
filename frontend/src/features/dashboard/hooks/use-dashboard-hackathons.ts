import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api";
import type { EventResponse } from "@/lib/api";

export const DASHBOARD_HACKATHONS_KEY = "dashboard-hackathons" as const;

export function useDashboardHackathons() {
  return useQuery({
    queryKey: [DASHBOARD_HACKATHONS_KEY],
    queryFn: async (): Promise<EventResponse[]> => {
      const page = await eventApi.list({ status: ["UPCOMING", "OPEN"], size: 50 });
      return page.content;
    },
  });
}
