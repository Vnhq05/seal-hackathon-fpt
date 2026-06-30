import { z } from "zod";

export const participantFeedbackSchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type ParticipantFeedbackFormValues = z.infer<typeof participantFeedbackSchema>;
