"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { SuccessBanner } from "@/shared/ui/success-banner";
import { PasswordField } from "@/features/auth/components/password-field";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { useSetupOfficialPassword } from "@/features/profile/hooks/use-setup-official-password";
import {
  setupOfficialPasswordSchema,
  type SetupOfficialPasswordFormValues,
} from "@/features/profile/schemas/setup-official-password.schema";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to set password. Please try again.";
}

export function SetupOfficialPasswordForm() {
  const {
    mutate: setOfficialPassword,
    isPending,
    isSuccess,
    isError,
    error,
    reset: resetStatus,
  } = useSetupOfficialPassword();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<SetupOfficialPasswordFormValues>({
    resolver: zodResolver(setupOfficialPasswordSchema),
  });

  const newPassword = useWatch({ control, name: "newPassword" }) ?? "";

  const onSubmit = (values: SetupOfficialPasswordFormValues) => {
    resetStatus();
    setOfficialPassword(values.newPassword, { onSuccess: () => resetForm() });
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
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#0e1528", marginBottom: "8px" }}>
        Set official password
      </h2>
      <p style={{ fontSize: "14px", color: "#8891a5", marginBottom: "20px", lineHeight: "21px" }}>
        You are using a temporary account from event registration. Set your official password here
        to upgrade to a permanent account. You can also update your profile details in the Personal tab.
      </p>

      {isError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}
      {isSuccess && (
        <div style={{ marginBottom: "16px" }}>
          <SuccessBanner message="Official password set. Your account is now permanent." />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col" style={{ gap: "16px" }}>
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
            {isPending ? "Saving…" : "Set official password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
