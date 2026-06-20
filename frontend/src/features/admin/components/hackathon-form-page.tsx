"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hackathonSchema, type HackathonFormValues } from "@/features/admin/schemas/hackathon.schema";
import {
  useAdminEvent,
  useCreateEvent,
  useUpdateEvent,
} from "@/features/admin/hooks/use-admin-hackathons";

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

export function HackathonFormPage({ hackathonId }: { hackathonId?: string }) {
  const router = useRouter();
  const isEdit = !!hackathonId;
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
          startDate: existing.startDate.split("T")[0],
          endDate: existing.endDate.split("T")[0],
          registrationDeadline: existing.registrationDeadline.split("T")[0],
        }
      : undefined,
  });

  const onSubmit = (values: HackathonFormValues) => {
    if (isEdit && hackathonId) {
      update({ eventId: hackathonId, ...values }, { onSuccess: () => router.push("/admin/hackathons") });
    } else {
      create(values, { onSuccess: () => router.push("/admin/hackathons") });
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
        className="flex flex-col gap-6 rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}
      >
        <div className="flex flex-col">
          <label style={labelStyle}>Name</label>
          <input {...register("name")} style={inputStyle} placeholder="Event name" />
          {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Season</label>
            <input {...register("season")} style={inputStyle} placeholder="e.g. SPRING, FALL" />
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

        <div className="flex flex-col">
          <label style={labelStyle}>Registration Deadline</label>
          <input type="date" {...register("registrationDeadline")} style={inputStyle} />
          {errors.registrationDeadline && <span style={errorStyle}>{errors.registrationDeadline.message}</span>}
        </div>

        <div className="flex gap-3" style={{ marginTop: 8 }}>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg"
            style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/hackathons")}
            className="rounded-lg"
            style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
