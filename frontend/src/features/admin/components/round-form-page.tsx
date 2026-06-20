"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roundSchema, type RoundFormValues } from "@/features/admin/schemas/round.schema";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRound, useCreateRound, useUpdateRound } from "@/features/admin/hooks/use-admin-rounds";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#dc2626", marginTop: 4 };

export function RoundFormPage({ roundId }: { roundId?: string }) {
  const router = useRouter();
  const isEdit = !!roundId;

  // For editing, we need the eventId to fetch the round.
  // In a real app this would come from URL params. We track it in state.
  const [selectedEventId, setSelectedEventId] = useState("");
  const { data: eventsPage } = useAdminEvents();
  const events = eventsPage?.content ?? [];

  const { data: existing, isLoading: loadingExisting } = useAdminRound(selectedEventId, roundId ?? "");
  const { mutate: create, isPending: creating } = useCreateRound(selectedEventId);
  const { mutate: update, isPending: updating } = useUpdateRound(selectedEventId);
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RoundFormValues>({
    resolver: zodResolver(roundSchema),
    values: isEdit && existing
      ? {
          eventId: existing.eventId,
          roundNumber: existing.roundNumber,
          name: existing.name,
          startDate: existing.startDate.split("T")[0],
          endDate: existing.endDate.split("T")[0],
          submissionDeadline: existing.submissionDeadline.split("T")[0],
          scoringDeadline: existing.scoringDeadline.split("T")[0],
          advancementCutoff: existing.advancementCutoff,
        }
      : undefined,
  });

  // Sync selectedEventId when existing loads
  if (isEdit && existing && selectedEventId !== existing.eventId) {
    setSelectedEventId(existing.eventId);
  }

  const onSubmit = (values: RoundFormValues) => {
    const { eventId: evId, ...roundData } = values;
    if (isEdit && roundId) {
      update({ roundId, ...roundData }, { onSuccess: () => router.push("/admin/hackathons") });
    } else {
      create(roundData, { onSuccess: () => router.push("/admin/hackathons") });
    }
  };

  if (isEdit && loadingExisting && selectedEventId) {
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
          {isEdit ? "Edit Round" : "Create Round"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}
      >
        <div className="flex flex-col">
          <label style={labelStyle}>Event</label>
          <select
            {...register("eventId")}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setValue("eventId", e.target.value);
            }}
            style={inputStyle}
          >
            <option value="">Select event</option>
            {events.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {errors.eventId && <span style={errorStyle}>{errors.eventId.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Round Number</label>
            <input type="number" {...register("roundNumber", { valueAsNumber: true })} style={inputStyle} placeholder="e.g. 1" />
            {errors.roundNumber && <span style={errorStyle}>{errors.roundNumber.message}</span>}
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Name</label>
            <input {...register("name")} style={inputStyle} placeholder="Round name" />
            {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
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
            <label style={labelStyle}>Submission Deadline</label>
            <input type="date" {...register("submissionDeadline")} style={inputStyle} />
            {errors.submissionDeadline && <span style={errorStyle}>{errors.submissionDeadline.message}</span>}
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Scoring Deadline</label>
            <input type="date" {...register("scoringDeadline")} style={inputStyle} />
            {errors.scoringDeadline && <span style={errorStyle}>{errors.scoringDeadline.message}</span>}
          </div>
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Advancement Cutoff</label>
          <input type="number" {...register("advancementCutoff", { valueAsNumber: true })} style={inputStyle} placeholder="e.g. 70" />
          {errors.advancementCutoff && <span style={errorStyle}>{errors.advancementCutoff.message}</span>}
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
