"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useHackathonRegistration } from "@/features/events/hooks/use-hackathon-registration";
import {
  hackathonRegistrationSchema,
  type HackathonRegistrationFormValues,
} from "@/features/events/schemas/hackathon-registration.schema";
import { Button } from "@/shared/ui/button";

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
  } = useForm<HackathonRegistrationFormValues>({
    resolver: zodResolver(hackathonRegistrationSchema),
    defaultValues: {
      confirmStudent: false,
      agreeCodeOfConduct: false,
      agreeTeamFormation: false,
    },
  });

  const { register, isPending, isError, error } =
    useHackathonRegistration(hackathonId);

  const onSubmit = () => {
    register();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6"
    >
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
            commencement. You can create your team later from the Teams page.
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
