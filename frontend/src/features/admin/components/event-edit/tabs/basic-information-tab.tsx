"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  basicInformationSchema,
  type BasicInformationFormValues,
} from "@/features/admin/schemas/hackathon.schema";
import {
  useDeleteEventAvatar,
  useUpdateEvent,
  useUploadEventAvatar,
} from "@/features/admin/hooks/use-admin-hackathons";
import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import type { EventResponse } from "@/lib/api";
import { EventAvatarDialog } from "@/features/admin/components/event-edit/event-avatar-dialog";
import {
  bannerErrorStyle,
  errorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
  mergeEventUpdate,
  toDateInput,
} from "@/features/admin/components/event-edit/event-edit.utils";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

const readOnlyStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: "#eef0f6",
  color: "#8891a5",
};

export function BasicInformationTab({ event }: { event: EventResponse }) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const { data: systemConfig } = useSystemTeamConfig();
  const { mutate: update, isPending } = useUpdateEvent();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadEventAvatar();
  const { mutate: removeAvatar, isPending: isRemoving } = useDeleteEventAvatar();
  const editable = isEventEditable(event.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInformationFormValues>({
    resolver: zodResolver(basicInformationSchema),
    values: {
      name: event.name,
      season: event.season,
      year: event.year,
      startDate: toDateInput(event.startDate),
      endDate: toDateInput(event.endDate),
      registrationOpenDate: toDateInput(event.registrationOpenDate),
      registrationDeadline: toDateInput(event.registrationDeadline),
      description: event.description ?? "",
      location: event.location ?? "",
    },
  });

  const onSubmit = (values: BasicInformationFormValues) => {
    setSaveError(null);
    setSaveSuccess(false);
    update(
      {
        eventId: event.id,
        ...mergeEventUpdate(event, {
          name: values.name,
          season: values.season,
          year: values.year,
          startDate: values.startDate,
          endDate: values.endDate,
          registrationOpenDate: values.registrationOpenDate,
          registrationDeadline: values.registrationDeadline,
          description: values.description ?? undefined,
          location: values.location ?? undefined,
          format: event.format ?? "OFFLINE",
        }),
      },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save"),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6 border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228] sm:p-8"
    >
      {!editable && (
        <div style={bannerErrorStyle}>
          Event cannot be edited while active or after completion.
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setAvatarError(null);
            setAvatarOpen(true);
          }}
          className="border-2 border-navy bg-white px-3 py-2 font-mono text-xs font-bold text-navy shadow-[3px_3px_0_0_#0c1228]"
        >
          {event.avatarUrl ? "Avatar" : "Add Avatar"}
        </button>
        <span className="font-mono text-[10px] text-seal-text-muted">
          Optional · click to preview or change
        </span>
      </div>

      <EventAvatarDialog
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        avatarUrl={event.avatarUrl}
        editable={editable}
        isUploading={isUploading}
        isRemoving={isRemoving}
        error={avatarError}
        onUpload={(file) => {
          setAvatarError(null);
          uploadAvatar(
            { eventId: event.id, file },
            {
              onError: (err) =>
                setAvatarError(err instanceof Error ? err.message : "Upload failed"),
            },
          );
        }}
        onRemove={() => {
          setAvatarError(null);
          removeAvatar(event.id, {
            onError: (err) =>
              setAvatarError(err instanceof Error ? err.message : "Remove failed"),
          });
        }}
      />

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          {...register("description")}
          disabled={!editable}
          style={{ ...inputStyle, resize: "vertical" }}
          rows={5}
          placeholder="Event description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Location</label>
          <input
            {...register("location")}
            disabled={!editable}
            style={inputStyle}
            placeholder="Event location"
          />
        </div>
        <div>
          <label style={labelStyle}>Format</label>
          <input value="Offline" disabled style={readOnlyStyle} />
        </div>
      </div>

      <div className="flex flex-col">
        <label style={labelStyle}>Name</label>
        <input {...register("name")} disabled={!editable} style={inputStyle} placeholder="Event name" />
        {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Season</label>
          <select {...register("season")} disabled={!editable} style={inputStyle}>
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.season && <span style={errorStyle}>{errors.season.message}</span>}
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <input
            type="number"
            {...register("year", { valueAsNumber: true })}
            disabled={!editable}
            style={inputStyle}
          />
          {errors.year && <span style={errorStyle}>{errors.year.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Start Date</label>
          <input type="date" {...register("startDate")} disabled={!editable} style={inputStyle} />
          {errors.startDate && <span style={errorStyle}>{errors.startDate.message}</span>}
        </div>
        <div>
          <label style={labelStyle}>End Date</label>
          <input type="date" {...register("endDate")} disabled={!editable} style={inputStyle} />
          {errors.endDate && <span style={errorStyle}>{errors.endDate.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Registration Opens</label>
          <input type="date" {...register("registrationOpenDate")} disabled={!editable} style={inputStyle} />
          {errors.registrationOpenDate && <span style={errorStyle}>{errors.registrationOpenDate.message}</span>}
        </div>
        <div>
          <label style={labelStyle}>Registration Closes</label>
          <input type="date" {...register("registrationDeadline")} disabled={!editable} style={inputStyle} />
          {errors.registrationDeadline && <span style={errorStyle}>{errors.registrationDeadline.message}</span>}
        </div>
      </div>

      <div style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", marginBottom: 8 }}>
          System Configuration (read-only)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Min Members/Team</label>
            <input value={systemConfig?.minTeamMembers ?? 3} disabled style={readOnlyStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Max Members/Team</label>
            <input value={systemConfig?.maxTeamMembers ?? 5} disabled style={readOnlyStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Min Teams (for event to run)</label>
            <input value={systemConfig?.minTeams ?? "—"} disabled style={readOnlyStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Max Teams (close registration)</label>
            <input value={systemConfig?.maxTeams ?? "—"} disabled style={readOnlyStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Semester Min (eligibility)</label>
            <input value={systemConfig?.semesterMin ?? "—"} disabled style={readOnlyStyle} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Semester Max (eligibility)</label>
            <input value={systemConfig?.semesterMax ?? "—"} disabled style={readOnlyStyle} />
          </div>
        </div>
        {systemConfig?.defaultRules && (
          <div style={{ marginTop: 12 }}>
            <label style={{ ...labelStyle, color: "#8891a5" }}>System Rules (read-only)</label>
            <div
              style={{
                padding: 12,
                backgroundColor: "#eef0f6",
                borderRadius: 8,
                fontSize: 13,
                color: "#4a5468",
                whiteSpace: "pre-wrap",
                maxHeight: 160,
                overflowY: "auto",
              }}
            >
              {systemConfig.defaultRules}
            </div>
          </div>
        )}
      </div>

      {saveError && <div style={bannerErrorStyle}>{saveError}</div>}
      {saveSuccess && (
        <div style={{ ...bannerErrorStyle, color: "#166534", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }}>
          Saved successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !editable}
        className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
