import { z } from "zod";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";

export const resetPasswordSchema = z
  .object({
    password: z.string()
      .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters")
      .max(PASSWORD_MAX_LENGTH, "Password must not exceed 72 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one digit"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
