import { useQuery } from "@tanstack/react-query";
import { fetchSubmissionDetail } from "@/features/submissions/services/submission-detail.service";

export const SUBMISSION_DETAIL_KEY = "submission-detail" as const;

export function useSubmissionDetail(id: string) {
  return useQuery({
    queryKey: [SUBMISSION_DETAIL_KEY, id],
    queryFn: () => fetchSubmissionDetail(id),
    enabled: !!id,
  });
}
