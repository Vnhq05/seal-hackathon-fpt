import { z } from "zod";
import type { AllowedEmailDomainResponse } from "@/lib/api/event.api";
import {
  matchesAllowedDomain,
  universityMatchesEmail,
} from "@/lib/email-domain";

export const USER_TYPES = ["FPT_STUDENT", "EXTERNAL_STUDENT"] as const;

const FPT_STUDENT_ID_PATTERN = /^SE\d{6}$/;

const baseRegisterSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Vui lòng nhập email hợp lệ"),
  userType: z.enum(USER_TYPES),
  studentId: z.string().optional(),
  universityName: z.string().optional(),
  semester: z.number().int().min(1).max(10).optional().or(z.nan().transform(() => undefined)),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one digit"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  agreeToTerms: z
    .boolean()
    .refine((v) => v === true, "Bạn phải đồng ý với điều khoản để tiếp tục"),
  confirmEnrolled: z
    .boolean()
    .refine((v) => v === true, "Bạn phải xác nhận đang là sinh viên đang theo học"),
});

function applyParticipantRules(
  data: z.infer<typeof baseRegisterSchema>,
  ctx: z.RefinementCtx,
  allowedDomains: AllowedEmailDomainResponse[],
) {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      message: "Mật khẩu không khớp",
      path: ["confirmPassword"],
    });
  }
  const studentId = data.studentId?.trim().toUpperCase();
  if (!studentId) {
    ctx.addIssue({
      code: "custom",
      message:
        data.userType === "FPT_STUDENT"
          ? "Mã sinh viên FPT là bắt buộc"
          : "Mã sinh viên là bắt buộc",
      path: ["studentId"],
    });
  }
  if (data.userType === "FPT_STUDENT" && studentId && !FPT_STUDENT_ID_PATTERN.test(studentId)) {
    ctx.addIssue({
      code: "custom",
      message: "Mã sinh viên phải đúng định dạng SE + 6 chữ số (vd: SE191021)",
      path: ["studentId"],
    });
  }
  if (data.userType === "EXTERNAL_STUDENT") {
    const universityName = data.universityName?.trim();
    if (allowedDomains.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Không có domain email được phép. Vui lòng thử lại sau.",
        path: ["email"],
      });
      return;
    }
    if (!universityName) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng chọn trường đại học",
        path: ["universityName"],
      });
      return;
    }
    const domainRules = allowedDomains.map((d) => d.domain);
    if (domainRules.length > 0 && !matchesAllowedDomain(data.email, domainRules)) {
      ctx.addIssue({
        code: "custom",
        message: "Email phải thuộc domain trường được phép (vd: @hcmut.edu.vn)",
        path: ["email"],
      });
    }
    if (
      domainRules.length > 0 &&
      !universityMatchesEmail(data.email, universityName, allowedDomains)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Trường đã chọn không khớp với domain email",
        path: ["universityName"],
      });
    }
  }
}

export function createRegisterSchema(allowedDomains: AllowedEmailDomainResponse[] = []) {
  return baseRegisterSchema.superRefine((data, ctx) =>
    applyParticipantRules(data, ctx, allowedDomains),
  );
}

export const registerSchema = createRegisterSchema();

export type RegisterFormValues = z.infer<typeof baseRegisterSchema>;
