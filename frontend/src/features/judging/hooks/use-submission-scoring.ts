import { useQuery } from "@tanstack/react-query";
import { criteriaApi, submissionApi } from "@/lib/api";
import { judgingApi } from "@/lib/api/judging.api";
import { resolveFileUrl } from "@/lib/files";
import type { SubmissionForScoring } from "@/features/judging/types/judge.types";

export const SUBMISSION_SCORING_KEY = "judge-submission-scoring" as const;

export function useSubmissionScoring(roundId: string, teamId: string) {
  return useQuery<SubmissionForScoring>({
    queryKey: [SUBMISSION_SCORING_KEY, roundId, teamId],
    queryFn: async (): Promise<SubmissionForScoring> => {
      const [sub, assignments, criteria] = await Promise.all([
        submissionApi.getByTeam(roundId, teamId).catch(() => null),
        judgingApi.getMyAssignments(),
        criteriaApi.list(roundId),
      ]);

      if (!sub) throw new Error("Team has not submitted for this round");

      const assignment = assignments.find(
        (a) => a.teamId === teamId && a.roundId === roundId,
      );

      if (!assignment) {
        throw new Error("You are not assigned to score this team in this round");
      }

      const score = await judgingApi
        .getMyScoreForSubmission(roundId, sub.id)
        .catch(() => null);

      const version = sub.latestVersion;
      const commentMap = new Map(
        (score?.comments ?? []).map((c) => [c.criteriaId, c.comment]),
      );

      return {
        id: sub.id,
        teamId,
        teamName: assignment?.teamName ?? teamId,
        hackathonName: assignment?.eventName ?? "",
        roundName: assignment?.roundName ?? "",
        trackName: assignment?.trackName ?? null,
        roundId,
        deadline: assignment?.scoringDeadline ?? "",
        description: "",
        sourceCodeUrl: version?.sourceCodeUrl ?? version?.githubUrl ?? null,
        githubUrl: version?.sourceCodeUrl ?? version?.githubUrl ?? null,
        demoUrl: version?.demoUrl ?? null,
        pdfUrl: resolveFileUrl(version?.attachments?.[0]?.fileUrl ?? null),
        pdfFileName: version?.attachments?.[0]?.fileName ?? null,
        links: [],
        criteria: criteria.map((c) => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
          description: c.description ?? "",
          minScore: c.minScore ?? 1,
          maxScore: c.maxScore ?? 5,
        })),
        existingScores: score
          ? score.details.map((d) => ({
              criterionId: d.criteriaId,
              score: d.score,
              feedback: commentMap.get(d.criteriaId) ?? "",
            }))
          : null,
        scoreStatus: score?.status ?? null,
        judgeScoreId: score?.id ?? null,
        isDraft: score?.status === "IN_PROGRESS",
        isLocked: score?.status === "LOCKED",
        isCompleted: score?.status === "COMPLETED" || score?.status === "LOCKED",
        conflictOfInterest: assignment.conflictOfInterest ?? false,
        conflictReason: assignment.conflictReason ?? null,
        isAssigned: true,
      };
    },
    enabled: !!roundId && !!teamId,
  });
}
