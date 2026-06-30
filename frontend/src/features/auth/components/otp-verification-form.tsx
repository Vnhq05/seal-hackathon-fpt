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
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  verifyOtpSchema,
  type VerifyOtpFormValues,
} from "@/features/auth/schemas/verify-otp.schema";
import type { RegisterRequest } from "@/lib/api/auth.api";
import type { UserType } from "@/lib/api/types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Verification failed. Please try again.";
}

interface OtpVerificationFormProps {
  email: string;
  userType: Extract<UserType, "FPT_STUDENT" | "EXTERNAL_STUDENT">;
  registerPayload: RegisterRequest;
  registerMessage?: string;
}

export function OtpVerificationForm({
  email,
  userType,
  registerPayload,
  registerMessage,
}: OtpVerificationFormProps) {
  const { verifyOtpAsync, isPending, isError, error } = useVerifyOtp();
  const { resendOtp, isPending: isResending, isError: isResendError, error: resendError } =
    useRegister();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, otp: "" },
  });

  const onSubmit = async (values: VerifyOtpFormValues) => {
    const result = await verifyOtpAsync({
      email: values.email.trim(),
      otp: values.otp.trim(),
    });
    setSuccessMessage(result.message);
  };

  const onResend = () => {
    resendOtp(registerPayload);
  };

  if (successMessage) {
    const isFptStudent = userType === "FPT_STUDENT";
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
        {isFptStudent ? (
          <Link
            href="/login?verified=true"
            className="mt-4 font-medium text-royal hover:text-royal/80 hover:underline"
          >
            Sign in to your account
          </Link>
        ) : (
          <p className="max-w-[360px] text-center text-xs text-seal-text-muted">
            You will be notified once an administrator approves your account.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-mono text-xl font-semibold text-seal-text">Verify your email</h2>
        <p className="mt-2 text-sm text-seal-text-muted">
          {registerMessage ?? "We sent a 6-digit code to your email. Enter it below to continue."}
        </p>
        <p className="mt-1 text-sm font-medium text-seal-text">{email}</p>
      </div>

      {(isError || isResendError) && (
        <ErrorBanner message={getErrorMessage(error ?? resendError)} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <input type="hidden" {...register("email")} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-[0.4em]"
            {...register("otp")}
          />
          {errors.otp && (
            <p className="text-xs text-red-600" role="alert">
              {errors.otp.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Verifying…" : "Verify email"}
        </Button>
      </form>

      <div className="text-center text-sm text-seal-text-muted">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="font-medium text-royal hover:text-royal/80 hover:underline disabled:opacity-50"
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </div>
  );
}
