import { useQuery } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api/submission.api";
import { judgingApi } from "@/lib/api/judging.api";
import type { SubmissionForScoring } from "@/features/judging/types/judge.types";

export const SUBMISSION_SCORING_KEY = "judge-submission-scoring" as const;

/**
 * Fetches a submission together with the judge's existing scores for it.
 * Requires both roundId and submissionId since the backend APIs are round-scoped.
 */
export function useSubmissionScoring(roundId: string, submissionId: string) {
  return useQuery<SubmissionForScoring>({
    queryKey: [SUBMISSION_SCORING_KEY, roundId, submissionId],
    queryFn: async (): Promise<SubmissionForScoring> => {
      const [submission, myScore] = await Promise.all([
        submissionApi.getById(roundId, submissionId),
        judgingApi.getMyScoreForSubmission(roundId, submissionId).catch(() => null),
      ]);

      return {
        id: submission.id,
        teamName: submission.teamId,
        hackathonName: "",
        roundName: "",
        roundId,
        deadline: "",
        description: "",
        links: [],
        criteria: [],
        existingScores: myScore
          ? myScore.details.map((d) => ({
              criterionId: d.criteriaId,
              score: d.score,
              feedback: "",
            }))
          : null,
        isDraft: myScore?.status === "IN_PROGRESS",
      };
    },
    enabled: !!roundId && !!submissionId,
  });
}
