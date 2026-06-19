import { z } from "zod";

export const roundSchema = z.object({
  hackathonId: z.string().min(1, "Hackathon is required"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["ASYNC", "LIVE"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  submissionDeadline: z.string().min(1, "Submission deadline is required"),
});

export type RoundFormValues = z.infer<typeof roundSchema>;
