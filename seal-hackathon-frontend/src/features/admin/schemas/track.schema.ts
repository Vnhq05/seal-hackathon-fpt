import { z } from "zod";

export const trackSchema = z.object({
  hackathonId: z.string().min(1, "Hackathon is required"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().min(1, "Description is required"),
  maxTeams: z.number().min(1, "Max teams must be at least 1"),
  mentorId: z.string().optional(),
});

export type TrackFormValues = z.infer<typeof trackSchema>;
