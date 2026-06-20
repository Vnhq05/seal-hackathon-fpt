import { z } from "zod";

/**
 * @deprecated Tracks no longer exist in the backend.
 * This schema is kept for backward compatibility with the track form page.
 */
export const trackSchema = z.object({
  hackathonId: z.string().min(1, "Event is required"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().optional(),
  maxTeams: z.number().min(1, "Max teams must be at least 1").optional(),
  mentorId: z.string().optional(),
});

export type TrackFormValues = z.infer<typeof trackSchema>;
