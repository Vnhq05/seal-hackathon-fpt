import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";

export const SUBMISSION_DETAIL_KEY = "submission-detail" as const;

export function useSubmissionDetail(roundId: string, submissionId: string) {
  return useQuery({
    queryKey: [SUBMISSION_DETAIL_KEY, roundId, submissionId],
    queryFn: () => submissionApi.getById(roundId, submissionId),
    enabled: !!roundId && !!submissionId,
  });
}
