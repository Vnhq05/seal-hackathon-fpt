"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";
import { useHackathonRegistration } from "@/features/events/hooks/use-hackathon-registration";
import { Button } from "@/shared/ui/button";

/**
 * Extended registration schema that includes a team name (required by teamApi.create)
 * plus the original agreement checkboxes.
 */
const registrationSchema = z.object({
  teamName: z
    .string()
    .min(1, "Team name is required.")
    .max(100, "Team name must be 100 characters or less."),
  confirmStudent: z
    .boolean()
    .refine((v) => v === true, "You must confirm your student status."),
  agreeCodeOfConduct: z
    .boolean()
    .refine(
      (v) => v === true,
      "You must agree to the Code of Conduct and Rules.",
    ),
  agreeTeamFormation: z
    .boolean()
    .refine(
      (v) => v === true,
      "You must acknowledge the team formation requirement.",
    ),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M1 7h12M8 2l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const checkboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  border: "1px solid rgba(101,217,243,0.2)",
  borderRadius: 4,
  backgroundColor: "#eef0f6",
  accentColor: "#38bdf8",
  flexShrink: 0,
  cursor: "pointer",
  marginTop: 3,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#8891a5",
  lineHeight: "21px",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
  marginTop: -8,
};

interface RegistrationFormProps {
  hackathonId: string;
}

export function RegistrationForm({ hackathonId }: RegistrationFormProps) {
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      teamName: "",
      confirmStudent: false,
      agreeCodeOfConduct: false,
      agreeTeamFormation: false,
    },
  });

  const { register, isPending, isError, error } =
    useHackathonRegistration(hackathonId);

  const onSubmit = (values: RegistrationFormValues) => {
    register(values.teamName);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6"
    >
      {/* Team name input */}
      <div className="flex flex-col gap-2">
        <div
          style={{
            borderBottom: "1px solid rgba(223,226,236,0.8)",
            paddingBottom: 5,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "25.2px",
              margin: 0,
            }}
          >
            Team Name
          </h2>
        </div>
        <input
          type="text"
          placeholder="Enter your team name"
          {...registerField("teamName")}
          className="w-full rounded"
          style={{
            border: "1px solid rgba(223,226,236,0.8)",
            backgroundColor: "#eef0f6",
            padding: "11px 14px",
            fontSize: 14,
            color: "#0e1528",
            outline: "none",
          }}
        />
        {errors.teamName && (
          <span style={errorStyle}>{errors.teamName.message}</span>
        )}
      </div>

      {/* Agreements */}
      <div className="flex flex-col gap-4">
        <div
          style={{
            borderBottom: "1px solid rgba(223,226,236,0.8)",
            paddingBottom: 5,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "25.2px",
              margin: 0,
            }}
          >
            Agreements
          </h2>
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            {...registerField("confirmStudent")}
            style={checkboxStyle}
          />
          <span style={labelTextStyle}>
            I confirm that I am currently a student or have graduated within the
            last 12 months.
          </span>
        </label>
        {errors.confirmStudent && (
          <span style={errorStyle}>{errors.confirmStudent.message}</span>
        )}

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            {...registerField("agreeCodeOfConduct")}
            style={checkboxStyle}
          />
          <span style={labelTextStyle}>
            I have read and agree to the{" "}
            <strong style={{ color: "#0e1528" }}>Code of Conduct</strong> and
            official <strong style={{ color: "#0e1528" }}>Rules</strong>.
          </span>
        </label>
        {errors.agreeCodeOfConduct && (
          <span style={errorStyle}>{errors.agreeCodeOfConduct.message}</span>
        )}

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            {...registerField("agreeTeamFormation")}
            style={checkboxStyle}
          />
          <span style={labelTextStyle}>
            I understand that teams must be formed prior to the hacking phase
            commencement.
          </span>
        </label>
        {errors.agreeTeamFormation && (
          <span style={errorStyle}>{errors.agreeTeamFormation.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        {isError && (
          <div
            style={{ fontSize: 14, color: "#dc2626", textAlign: "center" }}
          >
            {error instanceof Error
              ? error.message
              : "Registration failed. Please try again."}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          style={{
            borderRadius: 4,
            padding: "15.5px 24px",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Complete Registration
          {!isPending && <ArrowRightIcon />}
        </Button>

        <p
          className="text-center"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#8891a5",
            letterSpacing: "0.24px",
            margin: 0,
          }}
        >
          Already registered?{" "}
          <Link href="/login" style={{ color: "#0e1528", fontWeight: 400 }}>
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
