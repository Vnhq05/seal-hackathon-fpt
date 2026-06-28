"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { SuccessBanner } from "@/shared/ui/success-banner";
import { PasswordField } from "@/features/auth/components/password-field";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { useChangePassword } from "@/features/profile/hooks/use-change-password";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/features/profile/schemas/change-password.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to change password. Please try again.";
}

export function ChangePasswordForm() {
  const {
    changePassword,
    isPending,
    isSuccess,
    isError,
    error,
    reset: resetStatus,
  } = useChangePassword();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";

  const onSubmit = (values: ChangePasswordFormValues) => {
    resetStatus();
    changePassword(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => resetForm() },
    );
  };

  return (
    <section
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        border: "1px solid rgba(223,226,236,0.8)",
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        padding: "33px 25px 41px 25px",
      }}
    >
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0e1528", marginBottom: "20px" }}>
        Change Password
      </h2>

      {isError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}
      {isSuccess && (
        <div style={{ marginBottom: "16px" }}>
          <SuccessBanner message="Password changed successfully." />
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col"
        style={{ gap: "16px" }}
      >
        <PasswordField
          id="currentPassword"
          label="Current Password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />

        <div className="flex flex-col" style={{ gap: "4px" }}>
          <PasswordField
            id="newPassword"
            label="New Password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <PasswordStrength password={newPassword} />
        </div>

        <PasswordField
          id="confirmNewPassword"
          label="Confirm New Password"
          error={errors.confirmNewPassword?.message}
          {...register("confirmNewPassword")}
        />

        <div
          className="flex items-start justify-end"
          style={{ borderTop: "1px solid rgba(223,226,236,0.8)", marginTop: 16, paddingTop: 17 }}
        >
          <Button
            type="submit"
            size="md"
            isLoading={isPending}
            style={{
              backgroundColor: "#38bdf8",
              width: "auto",
              padding: "8px 24px",
              borderRadius: "8px",
              fontSize: "12px",
              letterSpacing: "0.24px",
            }}
          >
            {isPending ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
