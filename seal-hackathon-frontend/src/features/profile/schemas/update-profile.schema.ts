import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  bio: z
    .string()
    .max(300, "Bio must be under 300 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\+?[\d\s\-()+]{7,20})?$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  studentId: z
    .string()
    .max(20, "Student ID must be under 20 characters")
    .optional()
    .or(z.literal("")),
  university: z
    .string()
    .max(100, "University must be under 100 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
