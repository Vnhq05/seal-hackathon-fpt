import { z } from "zod";

export const submitProjectSchema = z.object({
  repositoryUrl: z
    .string()
    .min(1, "Repository URL is required")
    .url("Please enter a valid URL"),
  demoUrl: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
  documentationUrl: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
  slideUrl: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal("")),
});

export type SubmitProjectFormValues = z.infer<typeof submitProjectSchema>;
