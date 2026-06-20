import { useQuery } from "@tanstack/react-query";

export const TRACKS_KEY = "tracks" as const;

/**
 * Tracks endpoint does not exist in the backend.
 * This hook is kept as a no-op stub so existing imports do not break.
 * Returns an empty array. Remove usages when the UI no longer needs tracks.
 */
export function useTracks() {
  return useQuery({
    queryKey: [TRACKS_KEY],
    queryFn: () => Promise.resolve([] as string[]),
    staleTime: Infinity,
  });
}
