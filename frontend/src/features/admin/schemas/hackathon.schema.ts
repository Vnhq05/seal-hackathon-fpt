import { z } from "zod";

/**
 * Schema aligned with CreateEventRequest:
 * {name, season, year, startDate, endDate, registrationOpenDate, registrationDeadline}
 */
const hackathonBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  season: z.string().min(1, "Season is required"),
  year: z.number().min(2000, "Year must be valid"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  registrationOpenDate: z.string().min(1, "Registration open date is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  semesterMin: z.number().int().min(1).max(10).optional().nullable(),
  semesterMax: z.number().int().min(1).max(10).optional().nullable(),
});

export const hackathonSchema = hackathonBaseSchema
  .refine((data) => data.registrationOpenDate < data.registrationDeadline, {
    message: "Registration deadline must be after open date",
    path: ["registrationDeadline"],
  })
  .refine((data) => data.registrationDeadline < data.startDate, {
    message: "Registration must close before event start date",
    path: ["registrationDeadline"],
  })
  .refine(
    (data) => {
      if (data.semesterMin == null || data.semesterMax == null) return true;
      return data.semesterMin <= data.semesterMax;
    },
    { message: "Semester min cannot exceed max", path: ["semesterMax"] },
  );

export type HackathonFormValues = z.infer<typeof hackathonSchema>;

export const createHackathonSchema = z
  .object({
    name: z
      .string()
      .min(1, "Event name is required")
      .max(200, "Name too long")
      .refine(
        (s) => /^[a-zA-Z\s]+$/.test(s.trim()),
        "Event name must contain only letters and spaces",
      ),
    startDate: z.string().min(1, "Start date is required"),
    duration: z.number().int().min(1).max(3, "Duration must be 1-3 days"),
    registrationOpenDate: z.string().min(1, "Registration open date is required"),
    registrationDeadline: z.string().min(1, "Registration close date is required"),
  })
  .refine((data) => data.registrationOpenDate < data.registrationDeadline, {
    message: "Registration deadline must be after open date",
    path: ["registrationDeadline"],
  })
  .refine((data) => data.registrationDeadline < data.startDate, {
    message: "Registration must close before event start date",
    path: ["registrationDeadline"],
  });

export type CreateHackathonFormValues = z.infer<typeof createHackathonSchema>;

export const basicInformationSchema = hackathonBaseSchema
  .omit({ semesterMin: true, semesterMax: true })
  .extend({
    description: z.string().optional(),
    location: z.string().optional(),
  });

export type BasicInformationFormValues = z.infer<typeof basicInformationSchema>;
