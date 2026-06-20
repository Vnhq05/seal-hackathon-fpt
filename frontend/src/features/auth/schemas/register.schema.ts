import { z } from "zod";

export const USER_TYPES = ["FPT_STUDENT", "EXTERNAL_STUDENT"] as const;

export const registerSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    userType: z.enum(USER_TYPES),
    studentId: z.string().optional(),
    universityName: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z
      .boolean()
      .refine((v) => v === true, "You must agree to the terms to continue"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (!data.studentId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message:
          data.userType === "FPT_STUDENT"
            ? "FPT Student ID is required"
            : "Student ID is required for external students",
        path: ["studentId"],
      });
    }
    if (data.userType === "EXTERNAL_STUDENT" && !data.universityName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "University name is required for external students",
        path: ["universityName"],
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
