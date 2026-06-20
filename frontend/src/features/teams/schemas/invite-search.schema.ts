import { z } from "zod";

export const inviteSearchSchema = z.object({
  search: z.string().max(200).default(""),
});

export type InviteSearchValues = z.infer<typeof inviteSearchSchema>;
