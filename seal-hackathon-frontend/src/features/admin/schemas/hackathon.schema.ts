import { z } from "zod";

export const hackathonSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  format: z.string().min(1, "Format is required"),
  minTeamSize: z.number().min(1, "Min team size must be at least 1"),
  maxTeamSize: z.number().min(1, "Max team size must be at least 1"),
  prizePool: z.string().min(1, "Prize pool is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
});

export type HackathonFormValues = z.infer<typeof hackathonSchema>;
