import { z } from "zod";
import { isEduVnEmail } from "@/lib/email-domain";

const baseExternalRegistrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required.").max(100),
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
  studentId: z.string().min(1, "Student ID is required.").max(50),
  universityName: z.string().min(1, "University is required.").max(200),
  semester: z.preprocess(
    (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)),
    z.number().int().optional(),
  ) as z.ZodType<number | undefined, number | undefined>,
  confirmEnrolled: z
    .boolean()
    .refine((v) => v === true, "You must confirm you are currently enrolled as a student."),
});

export interface SemesterRange {
  min: number;
  max: number;
}

export function createExternalRegistrationSchema(semesterRange?: SemesterRange | null) {
  return baseExternalRegistrationSchema.superRefine((data, ctx) => {
    if (!isEduVnEmail(data.email)) {
      ctx.addIssue({
        code: "custom",
        message: "Email must use a university domain ending in .edu.vn (e.g. student@hcmut.edu.vn).",
        path: ["email"],
      });
    }
    if (semesterRange) {
      if (data.semester == null) {
        ctx.addIssue({
          code: "custom",
          message: `Semester is required (semester ${semesterRange.min}–${semesterRange.max}).`,
          path: ["semester"],
        });
      } else if (data.semester < semesterRange.min || data.semester > semesterRange.max) {
        ctx.addIssue({
          code: "custom",
          message: `Semester must be between ${semesterRange.min} and ${semesterRange.max}.`,
          path: ["semester"],
        });
      }
    }
  });
}

export const externalRegistrationSchema = createExternalRegistrationSchema();

export type ExternalRegistrationFormValues = z.infer<typeof baseExternalRegistrationSchema>;
