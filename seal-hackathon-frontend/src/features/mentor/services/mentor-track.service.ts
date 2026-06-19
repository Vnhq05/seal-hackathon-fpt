import { apiClient } from "@/lib/axios";
import type { MentorTrackDetailResponse } from "@/features/mentor/types/mentor-track.types";

export async function fetchMentorTrackDetail(): Promise<MentorTrackDetailResponse> {
  const { data } = await apiClient.get<MentorTrackDetailResponse>(
    "/mentor/track",
  );
  return data;
}
