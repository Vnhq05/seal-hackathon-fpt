import { z } from "zod";

export const criterionScoreSchema = z.object({
  criterionId: z.string().min(1),
  score: z
    .number()
    .min(0)
    .max(10, "Score must be at most 10")
    .nullable(),
  feedback: z.string(),
});

export const scoringFormSchema = z.object({
  scores: z.array(criterionScoreSchema).min(1, "At least one criterion is required"),
});

export type ScoringFormValues = z.infer<typeof scoringFormSchema>;
