import { z } from "zod";
import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE } from "@/features/judging/constants/scoring-scale";

export interface CriterionBounds {
  id: string;
  minScore: number;
  maxScore: number;
}

const baseCriterionScoreSchema = z.object({
  criterionId: z.string().min(1),
  score: z.number().nullable(),
  feedback: z.string(),
});

/** Fallback schema before round criteria are loaded. */
export const scoringFormSchema = z.object({
  scores: z.array(baseCriterionScoreSchema).min(1, "At least one criterion is required"),
});

export type ScoringFormValues = z.infer<typeof scoringFormSchema>;

export function createScoringFormSchema(criteria: CriterionBounds[]) {
  const boundsById = new Map(
    criteria.map((c) => [c.id, { min: c.minScore, max: c.maxScore }]),
  );

  return z.object({
    scores: z
      .array(baseCriterionScoreSchema)
      .min(1, "At least one criterion is required")
      .superRefine((scores, ctx) => {
        scores.forEach((entry, index) => {
          if (entry.score == null) return;
          const bounds = boundsById.get(entry.criterionId);
          if (!bounds) return;
          if (entry.score < bounds.min || entry.score > bounds.max) {
            ctx.addIssue({
              code: "custom",
              message: `Score must be between ${bounds.min} and ${bounds.max}`,
              path: [index, "score"],
            });
          }
        });
      }),
  });
}

export function needsCommentForScore(
  score: number,
  minScore: number = DEFAULT_MIN_SCORE,
  maxScore: number = DEFAULT_MAX_SCORE,
): boolean {
  return score === minScore || score === maxScore;
}

export function computeWeightedScore(
  score: number,
  weight: number,
): number {
  return (score * weight) / 100;
}

export function computeMaxWeightedScore(
  criteria: { maxScore: number; weight: number }[],
): number {
  return criteria.reduce(
    (sum, c) => sum + computeWeightedScore(c.maxScore, c.weight),
    0,
  );
}
