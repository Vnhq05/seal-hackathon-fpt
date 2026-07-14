import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be under 50 characters"),
  lastName: z
    .string()
    .max(50, "Last name must be under 50 characters"),
  phone: z
    .string()
    .regex(/^(\+?[\d\s\-()+]{7,20})?$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

/** Split stored fullName into first / last for the profile form. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}
