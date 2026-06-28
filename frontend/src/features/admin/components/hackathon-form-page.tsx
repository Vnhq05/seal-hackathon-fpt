"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hackathonSchema, type HackathonFormValues } from "@/features/admin/schemas/hackathon.schema";
import {
  useAdminEvent,
  useCreateEvent,
  useUpdateEvent,
} from "@/features/admin/hooks/use-admin-hackathons";
import type { EventResponse, UpdateEventRequest } from "@/lib/api";

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
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
  marginTop: 4,
};

const bannerErrorStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#991b1b",
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "10px 14px",
};

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;

function toDateInput(value: string | null | undefined): string {
  return value ? value.split("T")[0] : "";
}

function buildUpdatePayload(
  values: HackathonFormValues,
  existing: EventResponse,
): UpdateEventRequest {
  return {
    name: values.name,
    season: values.season,
    year: values.year,
    startDate: values.startDate,
    endDate: values.endDate,
    registrationOpenDate: values.registrationOpenDate,
    registrationDeadline: values.registrationDeadline,
    description: existing.description ?? undefined,
    location: existing.location ?? undefined,
    format: existing.format ?? undefined,
    minTeam: existing.minTeam ?? undefined,
    maxTeam: existing.maxTeam ?? undefined,
    semesterMin: existing.semesterMin ?? undefined,
    semesterMax: existing.semesterMax ?? undefined,
    scoringTemplateId: existing.scoringTemplateId ?? undefined,
    tiebreakerCriteria: existing.tiebreakerCriteria ?? undefined,
    prizes: existing.prizes.map((p) => ({
      trackId: p.trackId ?? undefined,
      rank: p.rank,
      value: p.value,
      quantity: p.quantity,
      label: p.label ?? undefined,
    })),
    honoredGuests: existing.honoredGuests.map((g) => ({
      fullName: g.fullName,
      title: g.title ?? undefined,
    })),
  };
}

export function HackathonFormPage({ hackathonId }: { hackathonId?: string }) {
  const router = useRouter();
  const isEdit = !!hackathonId;
  const [saveError, setSaveError] = useState<string | null>(null);
  const { data: existing, isLoading: loadingExisting } = useAdminEvent(hackathonId ?? "");
  const { mutate: create, isPending: creating } = useCreateEvent();
  const { mutate: update, isPending: updating } = useUpdateEvent();
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HackathonFormValues>({
    resolver: zodResolver(hackathonSchema),
    values: isEdit && existing
      ? {
          name: existing.name,
          season: existing.season,
          year: existing.year,
          startDate: toDateInput(existing.startDate),
          endDate: toDateInput(existing.endDate),
          registrationOpenDate: toDateInput(existing.registrationOpenDate),
          registrationDeadline: toDateInput(existing.registrationDeadline),
        }
      : undefined,
  });

  const onSubmit = (values: HackathonFormValues) => {
    setSaveError(null);

    if (isEdit && hackathonId && existing) {
      update(
        { eventId: hackathonId, ...buildUpdatePayload(values, existing) },
        {
          onSuccess: () => router.push("/admin/hackathons"),
          onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save event"),
        },
      );
    } else {
      create(values, {
        onSuccess: () => router.push("/admin/hackathons"),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save event"),
      });
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <div style={{ padding: 24 }}>
        <div className="animate-pulse rounded" style={{ height: 24, width: 200, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          {isEdit ? "Edit Event" : "Create Event"}
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          {isEdit ? "Update event details." : "Fill in the details to create a new event."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 p-8 max-w-[720px] border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      >
        <div className="flex flex-col">
          <label style={labelStyle}>Name</label>
          <input {...register("name")} style={inputStyle} placeholder="Event name" />
          {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Season</label>
            <select {...register("season")} style={inputStyle} defaultValue="">
              <option value="">Select season...</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.season && <span style={errorStyle}>{errors.season.message}</span>}
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Year</label>
            <input type="number" {...register("year", { valueAsNumber: true })} style={inputStyle} placeholder="e.g. 2026" />
            {errors.year && <span style={errorStyle}>{errors.year.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Start Date</label>
            <input type="date" {...register("startDate")} style={inputStyle} />
            {errors.startDate && <span style={errorStyle}>{errors.startDate.message}</span>}
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>End Date</label>
            <input type="date" {...register("endDate")} style={inputStyle} />
            {errors.endDate && <span style={errorStyle}>{errors.endDate.message}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Registration Open Date</label>
            <input type="date" {...register("registrationOpenDate")} style={inputStyle} />
            {errors.registrationOpenDate && <span style={errorStyle}>{errors.registrationOpenDate.message}</span>}
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Registration Deadline</label>
            <input type="date" {...register("registrationDeadline")} style={inputStyle} />
            {errors.registrationDeadline && <span style={errorStyle}>{errors.registrationDeadline.message}</span>}
          </div>
        </div>

        {saveError && <div style={bannerErrorStyle}>{saveError}</div>}

        <div className="flex gap-3" style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={isPending}
            className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/hackathons")}
            className="border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
