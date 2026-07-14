"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHackathonSchema,
  type CreateHackathonFormValues,
} from "@/features/admin/schemas/hackathon.schema";
import { useCreateEvent, useUploadEventAvatar } from "@/features/admin/hooks/use-admin-hackathons";
import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import {
  blockNonLetterNameInput,
  formatDisplayDate,
  getEventEndDate,
  getInclusiveDayCount,
} from "@/features/admin/utils/event-wizard.utils";
import type { CreateEventRequest } from "@/lib/api";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "11px 16px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0e1528",
  marginBottom: 4,
  display: "block",
};

const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: "#f8f9fc",
  color: "#4a5468",
  cursor: "default",
};

const bannerErrorStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#991b1b",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "10px 14px",
};

export function CreateHackathonPage() {
  const router = useRouter();
  const portalBase = useStaffPortalBase();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { data: systemConfig, isLoading: isConfigLoading } = useSystemTeamConfig();
  const { mutate: create, isPending } = useCreateEvent();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useUploadEventAvatar();

  const seasonYearReady = Boolean(systemConfig?.currentSeason && systemConfig?.currentYear);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateHackathonFormValues>({
    resolver: zodResolver(createHackathonSchema),
    defaultValues: {
      name: "",
      startDate: "",
      duration: 1,
      registrationOpenDate: "",
      registrationDeadline: "",
    },
  });

  const startDate = watch("startDate");
  const duration = watch("duration");
  const eventEnd = startDate ? getEventEndDate(startDate, duration) : "";
  const inclusiveDays =
    startDate && eventEnd ? getInclusiveDayCount(startDate, eventEnd) : 0;

  const onSubmit = (values: CreateHackathonFormValues) => {
    if (!systemConfig?.currentSeason || !systemConfig?.currentYear) return;

    setSaveError(null);

    const payload: CreateEventRequest = {
      name: values.name.trim(),
      season: systemConfig.currentSeason,
      year: systemConfig.currentYear,
      startDate: values.startDate,
      endDate: getEventEndDate(values.startDate, values.duration),
      registrationOpenDate: values.registrationOpenDate,
      registrationDeadline: values.registrationDeadline,
    };

    create(payload, {
      onSuccess: async (event) => {
        try {
          if (avatarFile) {
            await uploadAvatar({ eventId: event.id, file: avatarFile });
          }
          router.push(`${portalBase}/hackathons/${event.id}`);
        } catch (err) {
          setSaveError(
            err instanceof Error
              ? `Event created, but avatar upload failed: ${err.message}`
              : "Event created, but avatar upload failed",
          );
          router.push(`${portalBase}/hackathons/${event.id}`);
        }
      },
      onError: (err) =>
        setSaveError(err instanceof Error ? err.message : "Failed to create event"),
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.64px",
            lineHeight: "38.4px",
          }}
        >
          Create Hackathon Event
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Fill in the details to create a new hackathon event.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-8 max-w-[720px] border border-[rgba(198,198,205,0.5)] bg-white rounded-xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Season</label>
            <div style={readOnlyStyle}>
              {isConfigLoading ? "Loading..." : systemConfig?.currentSeason ?? "—"}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Year</label>
            <div style={readOnlyStyle}>
              {isConfigLoading ? "Loading..." : systemConfig?.currentYear ?? "—"}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: -12 }}>
          Season and year are set automatically from system configuration.
        </p>

        <div>
          <label style={labelStyle}>Event Name</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                onChange={(e) => field.onChange(blockNonLetterNameInput(e.target.value))}
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? "#ef4444" : undefined,
                }}
                placeholder="Hackathon event name"
              />
            )}
          />
          {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>Avatar (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            style={inputStyle}
          />
          {avatarFile && (
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Selected: {avatarFile.name}
            </p>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>
            Timeline
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                {...register("startDate")}
                style={{
                  ...inputStyle,
                  borderColor: errors.startDate ? "#ef4444" : undefined,
                }}
              />
              {errors.startDate && <p style={errorStyle}>{errors.startDate.message}</p>}
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3" style={{ marginTop: 6 }}>
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => field.onChange(d)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          border:
                            field.value === d
                              ? "2px solid #38bdf8"
                              : "1px solid rgba(223,226,236,0.8)",
                          backgroundColor: field.value === d ? "#f0f9ff" : "#ffffff",
                          color: "#0e1528",
                        }}
                      >
                        {d} day{d > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.duration && <p style={errorStyle}>{errors.duration.message}</p>}
            </div>
          </div>

          {startDate && eventEnd && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 8,
                fontSize: 13,
                color: "#0369a1",
                marginTop: 16,
              }}
            >
              Event period: <strong>{formatDisplayDate(startDate)}</strong> to{" "}
              <strong>{formatDisplayDate(eventEnd)}</strong> ({inclusiveDays} day
              {inclusiveDays !== 1 ? "s" : ""})
            </div>
          )}

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Registration Opens</label>
              <input
                type="date"
                {...register("registrationOpenDate")}
                style={{
                  ...inputStyle,
                  borderColor: errors.registrationOpenDate ? "#ef4444" : undefined,
                }}
              />
              {errors.registrationOpenDate && (
                <p style={errorStyle}>{errors.registrationOpenDate.message}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Registration Closes</label>
              <input
                type="date"
                {...register("registrationDeadline")}
                style={{
                  ...inputStyle,
                  borderColor: errors.registrationDeadline ? "#ef4444" : undefined,
                }}
              />
              {errors.registrationDeadline && (
                <p style={errorStyle}>{errors.registrationDeadline.message}</p>
              )}
            </div>
          </div>
        </div>

        {saveError && <div style={bannerErrorStyle}>{saveError}</div>}

        <div className="flex gap-3" style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={isPending || isUploadingAvatar || isConfigLoading || !seasonYearReady}
            className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isUploadingAvatar ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`${portalBase}/hackathons`)}
            className="border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
