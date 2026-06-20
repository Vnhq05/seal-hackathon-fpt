"use client";

import { useForm, Controller } from "react-hook-form";
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
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Registration failed. Please try again.";
}

export function RegisterForm() {
  const { register: doRegister, isPending, isError, error } = useRegister();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { userType: "FPT_STUDENT", agreeToTerms: false },
  });

  const userType = watch("userType");
  const password = watch("password") ?? "";

  return (
    <div className="flex flex-col">
      <p className="mb-6 text-center text-xl font-bold tracking-wide text-seal-text">
        SEAL Hackathon
      </p>

      <div className="mb-6 text-center">
        <h1 className="text-[22px] font-semibold text-seal-text">
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
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="alex.chen@example.com"
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="universityName">University Name</Label>
            <Input
              id="universityName"
              type="text"
              placeholder="e.g. Hanoi University of Technology"
              autoComplete="organization"
              error={errors.universityName?.message}
              {...register("universityName")}
            />
          </div>
        )}

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
              {...register("agreeToTerms")}
            />
            <span className="text-[13px] leading-relaxed text-seal-text-secondary">
              I agree to the{" "}
              <Link href="/terms" className="text-seal-cyan hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-seal-cyan hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="text-xs text-seal-error">{errors.agreeToTerms.message}</p>
          )}
        </div>

        <Button type="submit" isLoading={isPending} size="lg" className="mt-1">
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-6 h-px bg-seal-border" />

      <p className="text-center text-sm text-seal-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-seal-cyan hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
