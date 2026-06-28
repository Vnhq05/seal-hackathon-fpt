import { useQuery } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { trackApi } from "@/lib/api/track.api";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import type { TrackRegistrationData } from "@/features/events/types/track-registration.types";

export const TRACK_REGISTRATION_KEY = "track-registration" as const;

export function useTrackRegistrationData(hackathonId: string) {
  const { data: teams } = useMyTeamsAllEvents();

  return useQuery({
    queryKey: [TRACK_REGISTRATION_KEY, hackathonId],
    queryFn: async (): Promise<TrackRegistrationData> => {
      const [event, tracks] = await Promise.all([
        eventApi.getById(hackathonId),
        trackApi.list(hackathonId),
      ]);
      const membership = teams?.find((t) => t.event.id === hackathonId);
      const team = membership?.team;

      return {
        hackathonId,
        hackathonName: event.name,
        teamId: team?.id ?? "",
        teamName: team?.name ?? "",
        assignedTrackId: team?.trackId ?? null,
        competitionFormat: event.competitionFormat ?? "GENERIC",
        tracks: tracks.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          topic: t.topic ?? null,
          maxTeams: t.maxTeams,
        })),
      };
    },
    enabled: !!hackathonId,
  });
}
