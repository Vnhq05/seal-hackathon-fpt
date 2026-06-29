"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExternalRegistrationSchema,
  type ExternalRegistrationFormValues,
} from "@/features/events/schemas/external-registration.schema";
import { useExternalEnrollment } from "@/features/events/hooks/use-external-enrollment";
import { usePublicAllowedEmailDomains } from "@/features/events/hooks/use-allowed-email-domains";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";
import { ParticipationBlockBanner } from "@/features/events/components/participation-block-banner";
import { uniqueUniversityLabels } from "@/lib/email-domain";
import { Button } from "@/shared/ui/button";
import type { EventResponse } from "@/lib/api/event.api";

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
  event: EventResponse;
}

export function ExternalRegistrationForm({ event }: ExternalRegistrationFormProps) {
  const eventId = event.id;
  const eventName = event.name;
  const [submitted, setSubmitted] = useState(false);

  const { isRegistrationOpen, registrationClosedReason } = useEventParticipationGate(event);

  const { data: allowedDomains = [], isLoading: domainsLoading } = usePublicAllowedEmailDomains(eventId);

  const externalRegistrationSchema = useMemo(
    () => createExternalRegistrationSchema(allowedDomains),
    [allowedDomains],
  );

  const universityOptions = useMemo(
    () => uniqueUniversityLabels(allowedDomains),
    [allowedDomains],
  );

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
      confirmEnrolled: false,
    },
  });

  const { submit, isPending, isError, error } = useExternalEnrollment(eventId);

  const domainsBlocked = domainsLoading || allowedDomains.length === 0;
  const canSubmit = isRegistrationOpen && !domainsBlocked;

  const onSubmit = async (values: ExternalRegistrationFormValues) => {
    await submit(values);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Registration submitted!</p>
          <p className="mt-2">
            Your request to join <strong>{eventName}</strong> is pending coordinator approval.
            You will receive login credentials by email once approved.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-royal hover:underline"
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
      <div className="bg-sky-50 p-4 text-sm text-sky-900 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <p className="font-semibold">Event registration for external students</p>
        <p className="mt-1 text-sky-800">
          This is not the same as Create Account on the login page. Submit your details to request
          a <strong>temporary student account</strong> for this hackathon. After coordinator approval,
          you will receive login credentials by email — no permanent signup required.
        </p>
      </div>

      {domainsLoading ? (
        <p className="text-sm text-seal-text-secondary">Loading approved university email domains...</p>
      ) : allowedDomains.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No allowed email domains configured for this event. Contact the organizer.
        </div>
      ) : (
        <div className="text-sm text-seal-text-secondary">
          <p className="font-semibold text-seal-text">Approved university email domains</p>
          <ul className="mt-2 list-disc pl-5">
            {allowedDomains.map((d) => (
              <li key={d.domain}>
                @{d.domain}
                {d.universityLabel ? ` — ${d.universityLabel}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label style={labelStyle}>Full name</label>
          <input type="text" placeholder="Nguyen Van A" className="w-full rounded" style={inputStyle} {...register("fullName")} />
          {errors.fullName && <span style={errorStyle}>{errors.fullName.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>University email</label>
          <input type="email" placeholder="student@hcmut.edu.vn" className="w-full rounded" style={inputStyle} {...register("email")} />
          {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>Student ID</label>
          <input type="text" placeholder="Student ID" className="w-full rounded" style={inputStyle} {...register("studentId")} />
          {errors.studentId && <span style={errorStyle}>{errors.studentId.message}</span>}
        </div>

        <div>
          <label style={labelStyle}>University</label>
          <select
            className="w-full rounded"
            style={inputStyle}
            {...register("universityName")}
          >
            <option value="">Select university</option>
            {universityOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          {errors.universityName && <span style={errorStyle}>{errors.universityName.message}</span>}
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <input type="checkbox" className="mt-1" {...register("confirmEnrolled")} />
          <span className="text-sm text-seal-text-secondary">
            I confirm that I am currently enrolled as a student (not graduated).
          </span>
        </label>
        {errors.confirmEnrolled && <span style={errorStyle}>{errors.confirmEnrolled.message}</span>}
      </div>

      {isError && (
        <div className="text-center text-sm text-red-600">
          {error instanceof Error ? error.message : "Registration failed. Please try again."}
        </div>
      )}

      {!isRegistrationOpen && registrationClosedReason && (
        <ParticipationBlockBanner reason={registrationClosedReason} className="text-center" />
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isPending}
        disabled={!canSubmit}
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
