import { apiClient } from "@/lib/axios";
import type {
  HackathonDetail,
  HackathonRegistrationRequest,
  HackathonRegistrationResponse,
} from "@/features/events/types/hackathon-registration.types";

export async function fetchHackathonDetail(
  id: string,
): Promise<HackathonDetail> {
  const { data } = await apiClient.get<HackathonDetail>(`/hackathons/${id}`);
  return data;
}

export async function registerForHackathon(
  payload: HackathonRegistrationRequest,
): Promise<HackathonRegistrationResponse> {
  const { data } = await apiClient.post<HackathonRegistrationResponse>(
    `/hackathons/${payload.hackathonId}/register`,
    payload,
  );
  return data;
}
