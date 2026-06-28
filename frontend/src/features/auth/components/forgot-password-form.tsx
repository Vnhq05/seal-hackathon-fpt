"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { ForgotPasswordIcon } from "@/features/auth/components/forgot-password-icon";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas/forgot-password.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function SuccessBanner({ email }: { email: string }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-[10px] border border-seal-success/20 bg-seal-success/10 px-4 py-3"
    >
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="9" fill="var(--color-seal-success)" />
        <path
          d="M6 10l3 3 5-5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm text-seal-success">
        A reset link has been sent to <strong>{email}</strong>. Check your inbox.
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const { sendResetLink, isPending, isError, isSuccess, error } = useForgotPassword();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    sendResetLink(values);
  };

  return (
    <div className="flex flex-col">
      {/* Back to login */}
      <div className="mb-7">
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

      {/* Icon + heading */}
      <div className="mb-7 flex flex-col items-center gap-4 text-center">
        <ForgotPasswordIcon />
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-2xl font-bold text-seal-text">
            Forgot password?
          </h1>
          <p className="text-sm text-seal-text-secondary">
            Enter your registered email address to receive a
            <br />
            password reset link.
          </p>
        </div>
      </div>

      {/* Error / success banners */}
      {isError && (
        <div className="mb-5">
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}
      {isSuccess && (
        <div className="mb-5">
          <SuccessBanner email={getValues("email")} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="developer@hacksync.io"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <Button type="submit" size="lg" isLoading={isPending}>
          {isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      {/* Spam note */}
      <p className="mt-5 text-center text-sm text-seal-text-secondary">
        If you don&apos;t see it, be sure to check your spam folder.
      </p>
    </div>
  );
}
