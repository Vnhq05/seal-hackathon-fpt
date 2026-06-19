import { apiClient } from "@/lib/axios";
import type { SubmissionDetailResponse } from "@/features/submissions/types/submission-detail.types";

export async function fetchSubmissionDetail(
  id: string,
): Promise<SubmissionDetailResponse> {
  const { data } = await apiClient.get<SubmissionDetailResponse>(
    `/submissions/${id}`,
  );
  return data;
}
