import { apiClient } from "@/lib/axios";
import type {
  TrackRegistrationData,
  TrackRegistrationRequest,
  TrackRegistrationResponse,
} from "@/features/events/types/track-registration.types";

export async function fetchTrackRegistrationData(
  hackathonId: string,
): Promise<TrackRegistrationData> {
  const { data } = await apiClient.get<TrackRegistrationData>(
    `/hackathons/${hackathonId}/tracks`,
  );
  return data;
}

export async function registerForTrack(
  payload: TrackRegistrationRequest,
): Promise<TrackRegistrationResponse> {
  const { data } = await apiClient.post<TrackRegistrationResponse>(
    `/hackathons/${payload.hackathonId}/tracks/register`,
    payload,
  );
  return data;
}
