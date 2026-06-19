import { z } from "zod";

export const hackathonRegistrationSchema = z.object({
  confirmStudent: z
    .boolean()
    .refine((v) => v === true, "You must confirm your student status."),
  agreeCodeOfConduct: z
    .boolean()
    .refine((v) => v === true, "You must agree to the Code of Conduct and Rules."),
  agreeTeamFormation: z
    .boolean()
    .refine(
      (v) => v === true,
      "You must acknowledge the team formation requirement.",
    ),
});

export type HackathonRegistrationFormValues = z.infer<
  typeof hackathonRegistrationSchema
>;
