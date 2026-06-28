"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorBanner } from "@/features/auth/components/error-banner";
import { SuccessBanner } from "@/shared/ui/success-banner";
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile";
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from "@/features/profile/schemas/update-profile.schema";
import type { UserProfile } from "@/lib/api/user.api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to update profile. Please try again.";
}

function LockIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="4.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M2.5 4.5V3a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#0e1528",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  fontFamily: "Inter, sans-serif",
};

const editableInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: "6px",
  padding: "9px",
  fontSize: "14px",
  fontWeight: 400,
  color: "#0e1528",
  lineHeight: "21px",
  fontFamily: "Inter, sans-serif",
  backgroundColor: "#ffffff",
};

const readOnlyInputStyle: React.CSSProperties = {
  ...editableInputStyle,
  backgroundColor: "rgba(223,226,236,0.8)",
  borderColor: "rgba(223,226,236,0.8)",
  color: "#8891a5",
  cursor: "default",
};

interface ProfileInfoFormProps {
  profile: UserProfile;
}

export function ProfileInfoForm({ profile }: ProfileInfoFormProps) {
  const { updateProfile, isPending, isSuccess, isError, error, reset: resetStatus } =
    useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone ?? "",
    },
  });

  useEffect(() => {
    resetForm({
      fullName: profile.fullName,
      phone: profile.phone ?? "",
    });
  }, [profile, resetForm]);

  const onSubmit = (values: UpdateProfileFormValues) => {
    resetStatus();
    updateProfile({
      fullName: values.fullName,
      phone: values.phone || undefined,
    });
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
      <h2
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#0e1528",
          lineHeight: "25.2px",
          fontFamily: "Inter, sans-serif",
          marginBottom: 24,
        }}
      >
        Personal Information
      </h2>

      {isError && (
        <div style={{ marginBottom: "16px" }}>
          <ErrorBanner message={getErrorMessage(error)} />
        </div>
      )}
      {isSuccess && (
        <div style={{ marginBottom: "16px" }}>
          <SuccessBanner message="Profile updated successfully." />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div
          className="grid grid-cols-2"
          style={{ gap: 16 }}
        >
          {/* Full Name - editable */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <label htmlFor="fullName" style={fieldLabelStyle}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              className="focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{
                ...editableInputStyle,
                borderColor: errors.fullName ? "#ba1a1a" : "rgba(223,226,236,0.8)",
              }}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p style={{ fontSize: "11px", color: "#93000a" }}>{errors.fullName.message}</p>
            )}
          </div>

          {/* Email - read-only */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <div className="flex items-center gap-1">
              <label style={fieldLabelStyle}>Email Address</label>
              <LockIcon />
            </div>
            <input
              type="email"
              readOnly
              value={profile.email}
              style={readOnlyInputStyle}
              tabIndex={-1}
            />
          </div>

          {/* Phone - editable */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <label htmlFor="phone" style={fieldLabelStyle}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{
                ...editableInputStyle,
                borderColor: errors.phone ? "#ba1a1a" : "rgba(223,226,236,0.8)",
              }}
              {...register("phone")}
            />
            {errors.phone && (
              <p style={{ fontSize: "11px", color: "#93000a" }}>{errors.phone.message}</p>
            )}
          </div>

          {/* Student ID - read-only */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <div className="flex items-center gap-1">
              <label style={fieldLabelStyle}>Student ID</label>
              <LockIcon />
            </div>
            <input
              type="text"
              readOnly
              value={profile.studentId ?? "—"}
              style={readOnlyInputStyle}
              tabIndex={-1}
            />
          </div>

          {/* University - read-only */}
          <div className="flex flex-col" style={{ gap: 4 }}>
            <div className="flex items-center gap-1">
              <label style={fieldLabelStyle}>University</label>
              <LockIcon />
            </div>
            <input
              type="text"
              readOnly
              value={profile.universityName ?? "—"}
              style={readOnlyInputStyle}
              tabIndex={-1}
            />
          </div>
        </div>

        {/* Save button row */}
        <div
          className="flex items-start justify-end"
          style={{
            borderTop: "1px solid rgba(223,226,236,0.8)",
            marginTop: 16,
            paddingTop: 17,
          }}
        >
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className="text-white transition-opacity disabled:cursor-not-allowed"
            style={{
              backgroundColor: isDirty ? "#38bdf8" : "rgba(99, 102, 241, 0.5)",
              padding: "8px 24px",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: "12px",
              letterSpacing: "0.24px",
              borderRadius: "8px",
            }}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
