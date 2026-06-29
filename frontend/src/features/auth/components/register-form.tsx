"use client";

import { useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { RoleSelector } from "@/features/auth/components/role-selector";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { PasswordField } from "@/features/auth/components/password-field";
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  createRegisterSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";
import { useRegistrationAllowedDomains } from "@/features/events/hooks/use-allowed-email-domains";
import { uniqueUniversityLabels } from "@/lib/email-domain";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Registration failed. Please try again.";
}

export function RegisterForm() {
  const { register: doRegister, isPending, isError, error, isSuccess } = useRegister();

  const { data: allowedDomains = [], isLoading: domainsLoading } = useRegistrationAllowedDomains();

  const registerSchema = useMemo(
    () => createRegisterSchema(allowedDomains),
    [allowedDomains],
  );

  const universityOptions = useMemo(
    () => uniqueUniversityLabels(allowedDomains),
    [allowedDomains],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { userType: "FPT_STUDENT", agreeToTerms: false, confirmEnrolled: false },
  });

  const userType = useWatch({ control, name: "userType" });
  const password = useWatch({ control, name: "password" }) ?? "";

  const externalDomainsBlocked =
    userType === "EXTERNAL_STUDENT" && (domainsLoading || allowedDomains.length === 0);

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-mono text-xl font-semibold text-seal-text">Registration successful</h2>
        <p className="max-w-[360px] text-center text-sm text-seal-text-muted">
          Awaiting admin approval. You will be notified when your account is activated.
        </p>
        <Link
          href="/login"
          className="mt-4 font-medium text-royal hover:text-royal/80 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <p className="mb-6 text-center font-mono text-xl font-bold tracking-wide text-seal-text">
        SEAL Hackathon
      </p>

      <div className="mb-6 text-center">
        <h1 className="font-mono text-[22px] font-semibold text-seal-text">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-seal-text-secondary">
          Join the platform to register for upcoming hackathons.
          <br />
          Organizer review may be required.
        </p>
      </div>

      {isError && (
        <div className="mb-5">
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}

      <div className="mb-5">
        <Controller
          name="userType"
          control={control}
          render={({ field }) => (
            <RoleSelector value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <form onSubmit={handleSubmit(doRegister)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Alex Chen"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="studentId">
            {userType === "FPT_STUDENT" ? "FPT Student ID" : "Student ID"}
          </Label>
          <Input
            id="studentId"
            type="text"
            placeholder={userType === "FPT_STUDENT" ? "SE123456" : "Your university student ID"}
            autoComplete="off"
            error={errors.studentId?.message}
            {...register("studentId")}
          />
        </div>

        {userType === "EXTERNAL_STUDENT" && (
          <>
            {domainsLoading ? (
              <div className="rounded-md border border-seal-border bg-seal-surface-muted px-3 py-2 text-xs text-seal-text-secondary">
                Loading allowed email domains...
              </div>
            ) : allowedDomains.length === 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                No allowed email domains. Please try again later or contact the organizers.
              </div>
            ) : (
              <div className="rounded-md border border-seal-border bg-seal-surface-muted px-3 py-2 text-xs text-seal-text-secondary">
                <p className="font-medium text-seal-text">Allowed university email domains</p>
                <p className="mt-1">
                  {allowedDomains.map((d) => `@${d.domain}`).join(", ")}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="universityName">University</Label>
              <select
                id="universityName"
                className="h-10 w-full rounded-md border border-seal-border-dark bg-white px-3 text-sm text-seal-text outline-none focus:border-seal-cyan"
                aria-invalid={!!errors.universityName}
                {...register("universityName")}
              >
                <option value="">Select university</option>
                {universityOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.universityName && (
                <p className="text-xs text-seal-error">{errors.universityName.message}</p>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="semester">Current Semester (optional)</Label>
          <Input
            id="semester"
            type="number"
            placeholder="e.g. 5"
            autoComplete="off"
            error={errors.semester?.message}
            {...register("semester", { valueAsNumber: true })}
          />
        </div>

        <div>
          <PasswordField
            id="password"
            label="Password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-seal-border-dark accent-seal-cyan"
              {...register("confirmEnrolled")}
            />
            <span className="text-[13px] leading-relaxed text-seal-text-secondary">
              I confirm I am currently enrolled as a student (not yet graduated).
            </span>
          </label>
          {errors.confirmEnrolled && (
            <p className="text-xs text-seal-error">{errors.confirmEnrolled.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-seal-border-dark accent-seal-cyan"
              {...register("agreeToTerms")}
            />
            <span className="text-[13px] leading-relaxed text-seal-text-secondary">
              I agree to the{" "}
              <Link href="/terms" className="text-royal hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-royal hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-seal-error">{errors.agreeToTerms.message}</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          size="lg"
          className="mt-1"
          disabled={externalDomainsBlocked}
        >
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-seal-text-muted">
        Joining a hackathon as an external student without a permanent account? Use{" "}
        <Link href="/" className="font-medium text-seal-text">
          Register Now
        </Link>{" "}
        on the event from the home page instead.
      </p>

      <div className="my-6 h-px bg-seal-border" />

      <p className="text-center text-sm text-seal-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-royal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
