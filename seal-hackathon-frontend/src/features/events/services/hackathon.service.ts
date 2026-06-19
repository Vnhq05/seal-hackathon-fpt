import { apiClient } from "@/lib/axios";
import type {
  HackathonListParams,
  HackathonListResponse,
} from "@/features/events/types/hackathon.types";
import type { HackathonDetailResponse } from "@/features/events/types/hackathon-detail.types";

export async function fetchHackathons(
  params?: HackathonListParams,
): Promise<HackathonListResponse> {
  const { data } = await apiClient.get<HackathonListResponse>("/hackathons", {
    params,
  });
  return data;
}

export async function fetchHackathonDetail(
  id: string,
): Promise<HackathonDetailResponse> {
  const { data } = await apiClient.get<HackathonDetailResponse>(
    `/hackathons/${id}`,
  );
  return data;
}
