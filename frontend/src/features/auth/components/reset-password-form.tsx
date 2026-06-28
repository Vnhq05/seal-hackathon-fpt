"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { PasswordField } from "@/features/auth/components/password-field";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/reset-password.schema";

import Image from "next/image";

function SealLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo-removebg-preview.png" alt="SEAL Hackathon" width={32} height={32} className="rounded" />
      <span className="text-xl font-bold tracking-wide text-seal-text">
        SEAL <span className="text-royal">Hackathon</span>
      </span>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to reset password. The link may have expired.";
}

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { submitReset, isPending, isError, error } = useResetPassword({ token });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = (values: ResetPasswordFormValues) => {
    submitReset(values.password);
  };

  return (
    <div className="flex flex-col">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <SealLogo />
      </div>

      {/* Heading */}
      <div className="mb-6 text-center">
        <h1 className="font-mono text-[22px] font-bold text-seal-text">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-seal-text-secondary">
          Must be at least 8 characters and contain a number or symbol.
        </p>
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-5">
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div>
          <PasswordField
            id="password"
            label="New Password"
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

        <Button type="submit" size="lg" isLoading={isPending}>
          {isPending ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      {/* Back to login */}
      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-seal-text-secondary transition-colors hover:text-seal-text hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to login
        </Link>
      </div>
    </div>
  );
}
