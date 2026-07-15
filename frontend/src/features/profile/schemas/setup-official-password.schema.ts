import { z } from "zod";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";

export const setupOfficialPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters")
      .max(PASSWORD_MAX_LENGTH, "Password must not exceed 72 characters")
      .regex(
        /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        "Must contain a number or symbol",
      ),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmNewPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
      });
    }
  });

export type SetupOfficialPasswordFormValues = z.infer<typeof setupOfficialPasswordSchema>;
