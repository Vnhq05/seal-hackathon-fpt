import { z } from "zod";

export const criterionScoreSchema = z.object({
  criterionId: z.string().min(1),
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100"),
  feedback: z.string(),
});

export const scoringFormSchema = z.object({
  scores: z.array(criterionScoreSchema).min(1, "At least one criterion is required"),
});

export type ScoringFormValues = z.infer<typeof scoringFormSchema>;
