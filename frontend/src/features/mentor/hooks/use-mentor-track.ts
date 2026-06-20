import { useQuery } from "@tanstack/react-query";
import type { MentorTrackDetailResponse } from "@/features/mentor/types/mentor-track.types";

export const MENTOR_TRACK_KEY = "mentor-track" as const;

// TODO: backend endpoint not implemented yet — /mentor/track does not exist.
// No equivalent endpoint exists in the current backend.
export function useMentorTrack() {
  return useQuery<MentorTrackDetailResponse>({
    queryKey: [MENTOR_TRACK_KEY],
    queryFn: async (): Promise<MentorTrackDetailResponse> => {
      return {
        hackathonName: "",
        trackName: "",
        description: "",
        teams: [],
      } as unknown as MentorTrackDetailResponse;
    },
  });
}
