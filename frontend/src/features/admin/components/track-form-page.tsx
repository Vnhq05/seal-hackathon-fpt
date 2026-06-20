"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trackSchema, type TrackFormValues } from "@/features/admin/schemas/track.schema";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminTrack, useCreateTrack, useUpdateTrack, useMentorOptions } from "@/features/admin/hooks/use-admin-tracks";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#dc2626", marginTop: 4 };

export function TrackFormPage({ trackId }: { trackId?: string }) {
  const router = useRouter();
  const isEdit = !!trackId;
  const { data: _existing, isLoading: loadingExisting } = useAdminTrack(trackId ?? "");
  const { data: eventsPage } = useAdminEvents();
  const { data: mentors } = useMentorOptions();
  const { mutate: create, isPending: creating } = useCreateTrack();
  const { mutate: update, isPending: updating } = useUpdateTrack();
  const isPending = creating || updating;

  const events = eventsPage?.content ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    // useAdminTrack returns null for placeholder, so never populate edit values
  });

  const onSubmit = (values: TrackFormValues) => {
    if (isEdit && trackId) {
      update({ id: trackId, ...values }, { onSuccess: () => router.push("/admin/hackathons") });
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
          {isEdit ? "Edit Track" : "Create Track"}
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Tracks are deprecated. Use criteria per round instead.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}
      >
        <div className="flex flex-col">
          <label style={labelStyle}>Event</label>
          <select {...register("hackathonId")} style={inputStyle}>
            <option value="">Select event</option>
            {events.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {errors.hackathonId && <span style={errorStyle}>{errors.hackathonId.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Name</label>
          <input {...register("name")} style={inputStyle} placeholder="Track name" />
          {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Description</label>
          <textarea {...register("description")} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Track description" />
          {errors.description && <span style={errorStyle}>{errors.description.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Max Teams</label>
          <input type="number" {...register("maxTeams", { valueAsNumber: true })} style={inputStyle} />
          {errors.maxTeams && <span style={errorStyle}>{errors.maxTeams.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Assign Mentor</label>
          <select {...register("mentorId")} style={inputStyle}>
            <option value="">No mentor</option>
            {mentors?.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
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
