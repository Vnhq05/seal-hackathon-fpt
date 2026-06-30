import { z } from "zod";

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
