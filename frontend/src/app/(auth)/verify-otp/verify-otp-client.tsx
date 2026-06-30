"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { useVerifyOtp } from "@/features/auth/hooks/use-verify-otp";
import {
  verifyOtpSchema,
  type VerifyOtpFormValues,
} from "@/features/auth/schemas/verify-otp.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Verification failed. Please try again.";
}

export default function VerifyOtpPageClient() {
  const { verifyOtpAsync, isPending, isError, error } = useVerifyOtp();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp: "" },
  });

  const onSubmit = async (values: VerifyOtpFormValues) => {
    const result = await verifyOtpAsync({
      email: values.email.trim(),
      otp: values.otp.trim(),
    });
    setSuccessMessage(result.message);
  };

  if (successMessage) {
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
        <h2 className="font-mono text-xl font-semibold text-seal-text">Email verified</h2>
        <p className="max-w-[360px] text-center text-sm text-seal-text-muted">{successMessage}</p>
        <Link
          href="/login?verified=true"
          className="mt-4 font-medium text-royal hover:text-royal/80 hover:underline"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-mono text-[22px] font-semibold text-seal-text">Verify your email</h1>
        <p className="mt-2 text-sm text-seal-text-muted">
          Enter the 6-digit code sent to your email after registration.
        </p>
      </div>

      {isError && <ErrorBanner message={getErrorMessage(error)} />}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-[0.4em]"
            error={errors.otp?.message}
            {...register("otp")}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <p className="text-center text-sm text-seal-text-muted">
        Need a new code?{" "}
        <Link href="/register" className="font-medium text-royal hover:underline">
          Register again
        </Link>{" "}
        to resend (after cooldown).
      </p>
    </div>
  );
}
