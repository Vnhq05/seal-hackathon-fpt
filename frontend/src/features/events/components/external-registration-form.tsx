"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  externalRegistrationSchema,
  type ExternalRegistrationFormValues,
} from "@/features/events/schemas/external-registration.schema";
import { useExternalEnrollment } from "@/features/events/hooks/use-external-enrollment";
import { Button } from "@/shared/ui/button";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  backgroundColor: "#eef0f6",
  padding: "11px 14px",
  fontSize: 14,
  color: "#0e1528",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#4a5468",
  marginBottom: 6,
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
  marginTop: 4,
};

interface ExternalRegistrationFormProps {
  eventId: string;
  eventName: string;
}

export function ExternalRegistrationForm({ eventId, eventName }: ExternalRegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExternalRegistrationFormValues>({
    resolver: zodResolver(externalRegistrationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      studentId: "",
      universityName: "",
    },
  });

  const { submit, isPending, isError, error } = useExternalEnrollment(eventId);

  const onSubmit = async (values: ExternalRegistrationFormValues) => {
    await submit(values);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Registration submitted!</p>
          <p className="mt-2">
            Your request to join <strong>{eventName}</strong> is pending coordinator approval.
            You will receive login credentials by email once approved.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-seal-cyan hover:underline"
        >
          Already approved? Log in here
        </Link>
        <Link href="/" className="text-sm text-seal-text-muted hover:text-seal-text">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="rounded-lg bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">Event registration for external students</p>
        <p className="mt-1 text-sky-800">
          This is not the same as Create Account on the login page. Submit your details to request
          a <strong>temporary student account</strong> for this hackathon. After coordinator approval,
          you will receive login credentials by email — no permanent signup required.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label style={labelStyle}>Full name</label>
          <input type="text" placeholder="Nguyen Van A" className="w-full rounded" style={inputStyle} {...register("fullName")} />
          {errors.fullName && <span style={errorStyle}>{errors.fullName.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>Gmail</label>
          <input type="email" placeholder="you@gmail.com" className="w-full rounded" style={inputStyle} {...register("email")} />
          {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>Student ID</label>
          <input type="text" placeholder="Student ID" className="w-full rounded" style={inputStyle} {...register("studentId")} />
          {errors.studentId && <span style={errorStyle}>{errors.studentId.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>University</label>
          <input type="text" placeholder="University name" className="w-full rounded" style={inputStyle} {...register("universityName")} />
          {errors.universityName && <span style={errorStyle}>{errors.universityName.message}</span>}
        </div>
      </div>

      {isError && (
        <div className="text-center text-sm text-red-600">
          {error instanceof Error ? error.message : "Registration failed. Please try again."}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isPending}
        style={{ borderRadius: 4, padding: "15.5px 24px", fontSize: 18, fontWeight: 600 }}
      >
        Submit registration
      </Button>

      <p className="text-center text-xs text-seal-text-muted">
        Want a permanent account instead?{" "}
        <Link href="/register" className="font-medium text-seal-text">
          Create account
        </Link>
        {" · "}
        FPT student?{" "}
        <Link href="/login" className="font-medium text-seal-text">
          Log in
        </Link>
      </p>
    </form>
  );
}
