import { apiClient } from "@/lib/axios";
import type {
  SubmissionsResponse,
  SubmissionPipeline,
} from "@/features/submissions/types/submission.types";

export async function fetchMySubmissions(): Promise<SubmissionsResponse> {
  const { data } = await apiClient.get<SubmissionsResponse>("/submissions/me");
  return data;
}

export async function fetchSubmissionPipeline(): Promise<SubmissionPipeline> {
  const { data } = await apiClient.get<SubmissionPipeline>(
    "/submissions/pipeline",
  );
  return data;
}
