import { z } from "zod";

export const submitProjectSchema = z.object({
  repositoryUrl: z
    .string()
    .min(1, "Repository URL is required")
    .regex(/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/, "Invalid GitHub URL"),
  demoUrl: z
    .string()
    .min(1, "Demo URL is required")
    .url("Please enter a valid URL"),
});

export type SubmitProjectFormValues = z.infer<typeof submitProjectSchema>;
