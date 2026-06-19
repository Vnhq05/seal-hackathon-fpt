import { useQuery } from "@tanstack/react-query";
import { fetchSubmissionPipeline } from "@/features/submissions/services/submission.service";

export const SUBMISSION_PIPELINE_KEY = "submission-pipeline" as const;

export function useSubmissionPipeline() {
  return useQuery({
    queryKey: [SUBMISSION_PIPELINE_KEY],
    queryFn: fetchSubmissionPipeline,
  });
}
