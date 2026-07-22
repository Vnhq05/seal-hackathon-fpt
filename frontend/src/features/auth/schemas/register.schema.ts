import { z } from "zod";
import { isEduVnEmail } from "@/lib/email-domain";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";

export const USER_TYPES = ["FPT_STUDENT", "EXTERNAL_STUDENT"] as const;

const FPT_STUDENT_ID_PATTERN = /^SE\d{6}$/;

const baseRegisterSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  userType: z.enum(USER_TYPES),
  studentId: z.string().optional(),
  universityName: z.string().optional(),
  semester: z.number().int().min(1).max(10).optional().or(z.nan().transform(() => undefined)),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters")
    .max(PASSWORD_MAX_LENGTH, "Password must not exceed 72 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one digit"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  agreeToTerms: z
    .boolean()
    .refine((v) => v === true, "You must agree to the terms to continue"),
  confirmEnrolled: z
    .boolean()
    .refine((v) => v === true, "You must confirm you are currently enrolled as a student"),
});

function applyParticipantRules(
  data: z.infer<typeof baseRegisterSchema>,
  ctx: z.RefinementCtx,
) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }
  const studentId = data.studentId?.trim().toUpperCase();
  if (!studentId) {
    ctx.addIssue({
      code: "custom",
      message:
        data.userType === "FPT_STUDENT"
          ? "FPT student ID is required"
          : "Student ID is required",
      path: ["studentId"],
    });
  }
  if (data.userType === "FPT_STUDENT" && studentId && !FPT_STUDENT_ID_PATTERN.test(studentId)) {
    ctx.addIssue({
      code: "custom",
      message: "Student ID must match SE + 6 digits (e.g. SE191021)",
      path: ["studentId"],
    });
  }
  if (data.userType === "EXTERNAL_STUDENT") {
    const universityName = data.universityName?.trim();
    if (!universityName) {
      ctx.addIssue({
        code: "custom",
        message: "University name is required",
        path: ["universityName"],
      });
    }
    if (!isEduVnEmail(data.email)) {
      ctx.addIssue({
        code: "custom",
        message: "Email must use a university domain ending in .edu.vn (e.g. student@hcmut.edu.vn)",
        path: ["email"],
      });
    }
  }
}

export function createRegisterSchema() {
  return baseRegisterSchema.superRefine((data, ctx) =>
    applyParticipantRules(data, ctx),
  );
}

export const registerSchema = createRegisterSchema();

export type RegisterFormValues = z.infer<typeof baseRegisterSchema>;
