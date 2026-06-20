import { z } from "zod";

/**
 * Schema aligned with CreateEventRequest:
 * {name, season, year, startDate, endDate, registrationDeadline}
 */
export const hackathonSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  season: z.string().min(1, "Season is required"),
  year: z.number().min(2000, "Year must be valid"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
});

export type HackathonFormValues = z.infer<typeof hackathonSchema>;
