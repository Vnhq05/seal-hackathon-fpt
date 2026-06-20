"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { EyeOpenIcon, EyeOffIcon, ArrowRightIcon } from "@/features/auth/components/icons";
import { useLogin } from "@/features/auth/hooks/use-login";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Incorrect email or password. Please try again.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const { login, isPending, isError, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = (values: LoginFormValues) => {
    login(values);
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-seal-text">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Sign in to your account to continue.
        </p>
      </div>

      {/* Registration Success Banner */}
      {justRegistered && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-[10px] border border-seal-cyan/20 bg-seal-cyan/10 px-4 py-3"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="var(--color-seal-cyan)" />
            <path d="M6.5 10.5L9 13L13.5 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-seal-cyan">
            Registration successful! Please wait for admin approval before signing in.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {isError && (
        <div className="mb-6">
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="alex@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="password123"
              autoComplete="current-password"
              error={errors.password?.message}
              className="pr-12"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-seal-text-muted transition-colors duration-200 hover:text-seal-text focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between">
          <Checkbox id="rememberMe" label="Remember me" {...register("rememberMe")} />
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-seal-cyan transition-colors duration-200 hover:text-seal-cyan-dark hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" isLoading={isPending} size="lg">
          {isPending ? "Signing in..." : (
            <>
              Sign in
              <ArrowRightIcon />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-seal-border" />
        <span className="text-xs font-medium text-seal-text-muted">OR</span>
        <div className="h-px flex-1 bg-seal-border" />
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-seal-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-seal-cyan transition-colors duration-200 hover:text-seal-cyan-dark hover:underline">
          Register
        </Link>
      </p>

      {/* Bottom Note */}
      <p className="mt-8 text-center text-xs leading-relaxed text-seal-text-muted">
        Organizer approval may be required for certain roles.
        <br />
        By signing in, you agree to our{" "}
        <Link href="/terms" className="underline transition-opacity duration-200 hover:opacity-70">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
