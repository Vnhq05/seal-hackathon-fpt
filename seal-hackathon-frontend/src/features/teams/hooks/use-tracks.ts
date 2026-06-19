import { useQuery } from "@tanstack/react-query";
import { fetchTracks } from "@/features/teams/services/team.service";

export const TRACKS_KEY = "tracks" as const;

export function useTracks() {
  return useQuery({
    queryKey: [TRACKS_KEY],
    queryFn: fetchTracks,
  });
}
