import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";

export const SUBMISSION_VERSIONS_KEY = "submission-versions" as const;

export function useSubmissionVersions(
  roundId: string | undefined,
  submissionId: string | undefined,
) {
  return useQuery({
    queryKey: [SUBMISSION_VERSIONS_KEY, roundId, submissionId],
    queryFn: () => submissionApi.getVersionHistory(roundId!, submissionId!),
    enabled: !!roundId && !!submissionId,
  });
}
