import { useQuery } from "@tanstack/react-query";
import { fetchMentorTrackDetail } from "@/features/mentor/services/mentor-track.service";

export const MENTOR_TRACK_KEY = "mentor-track" as const;

export function useMentorTrack() {
  return useQuery({
    queryKey: [MENTOR_TRACK_KEY],
    queryFn: fetchMentorTrackDetail,
  });
}
