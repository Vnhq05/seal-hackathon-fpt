import { z } from "zod";

export const externalRegistrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required.").max(100),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  studentId: z.string().min(1, "Student ID is required.").max(50),
  universityName: z.string().min(1, "University name is required.").max(200),
});

export type ExternalRegistrationFormValues = z.infer<typeof externalRegistrationSchema>;
