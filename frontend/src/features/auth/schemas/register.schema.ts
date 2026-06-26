import { z } from "zod";

export const USER_TYPES = ["FPT_STUDENT", "EXTERNAL_STUDENT"] as const;

const FPT_STUDENT_ID_PATTERN = /^SE\d{6}$/;

export const registerSchema = z
  .object({
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
  })
  .superRefine((data, ctx) => {
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
    if (data.userType === "EXTERNAL_STUDENT" && !data.universityName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Tên trường là bắt buộc",
        path: ["universityName"],
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
