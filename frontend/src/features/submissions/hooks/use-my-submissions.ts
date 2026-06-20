import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { SubmissionResponse } from "@/lib/api";

export const MY_SUBMISSIONS_KEY = "my-submissions" as const;

export function useMySubmissions(roundId: string | undefined) {
  return useQuery({
    queryKey: [MY_SUBMISSIONS_KEY, roundId],
    queryFn: (): Promise<SubmissionResponse[]> => submissionApi.list(roundId!),
    enabled: !!roundId,
  });
}
