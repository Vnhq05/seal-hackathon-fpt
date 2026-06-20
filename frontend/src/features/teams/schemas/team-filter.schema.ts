import { z } from "zod";

export const teamFilterSchema = z.object({
  search: z.string().max(200).default(""),
  track: z.string().default(""),
  openOnly: z.boolean().default(false),
});

export type TeamFilterValues = z.infer<typeof teamFilterSchema>;
