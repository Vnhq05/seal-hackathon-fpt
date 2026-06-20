import { useQuery } from "@tanstack/react-query";
import { eventApi, type EventListParams } from "@/lib/api";

export const HACKATHONS_KEY = "hackathons" as const;

export function useHackathons(params?: EventListParams) {
  return useQuery({
    queryKey: [HACKATHONS_KEY, params],
    queryFn: () => eventApi.list(params),
  });
}
