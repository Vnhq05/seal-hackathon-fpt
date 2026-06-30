import { z } from "zod";
import type { AllowedEmailDomainResponse } from "@/lib/api/event.api";
import {
  matchesAllowedDomain,
  universityMatchesEmail,
} from "@/lib/email-domain";

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

export function createExternalRegistrationSchema(
  allowedDomains: AllowedEmailDomainResponse[] = [],
  semesterRange?: SemesterRange | null,
) {
  return baseExternalRegistrationSchema.superRefine((data, ctx) => {
    if (allowedDomains.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "No allowed email domains configured for this event. Contact the organizer.",
        path: ["email"],
      });
      return;
    }
    const universityName = data.universityName.trim();
    const domainRules = allowedDomains.map((d) => d.domain);
    if (domainRules.length > 0 && !matchesAllowedDomain(data.email, domainRules)) {
      ctx.addIssue({
        code: "custom",
        message: "Email must use an approved university domain.",
        path: ["email"],
      });
    }
    if (
      domainRules.length > 0 &&
      !universityMatchesEmail(data.email, universityName, allowedDomains)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Selected university does not match your email domain.",
        path: ["universityName"],
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
