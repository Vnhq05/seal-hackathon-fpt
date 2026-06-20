import { z } from "zod";

/**
 * Schema aligned with CreateRoundRequest:
 * {roundNumber, name, startDate, endDate, submissionDeadline, scoringDeadline, advancementCutoff}
 *
 * eventId is passed separately (via URL params), not part of the form schema.
 */
export const roundSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  roundNumber: z.number().min(1, "Round number must be at least 1"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  submissionDeadline: z.string().min(1, "Submission deadline is required"),
  scoringDeadline: z.string().min(1, "Scoring deadline is required"),
  advancementCutoff: z.number().min(0, "Advancement cutoff must be >= 0"),
});

export type RoundFormValues = z.infer<typeof roundSchema>;
