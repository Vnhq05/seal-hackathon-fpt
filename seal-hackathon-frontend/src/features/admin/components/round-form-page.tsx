"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roundSchema, type RoundFormValues } from "@/features/admin/schemas/round.schema";
import { useAdminHackathons } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRound, useCreateRound, useUpdateRound } from "@/features/admin/hooks/use-admin-rounds";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#dc2626", marginTop: 4 };

export function RoundFormPage({ roundId }: { roundId?: string }) {
  const router = useRouter();
  const isEdit = !!roundId;
  const { data: existing, isLoading: loadingExisting } = useAdminRound(roundId ?? "");
  const { data: hackathonsData } = useAdminHackathons();
  const { mutate: create, isPending: creating } = useCreateRound();
  const { mutate: update, isPending: updating } = useUpdateRound();
  const isPending = creating || updating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoundFormValues>({
    resolver: zodResolver(roundSchema),
    values: isEdit && existing
      ? {
          hackathonId: existing.hackathonId,
          name: existing.name,
          description: existing.description,
          type: existing.type,
          startDate: existing.startDate.split("T")[0],
          endDate: existing.endDate.split("T")[0],
          submissionDeadline: existing.submissionDeadline.split("T")[0],
        }
      : undefined,
  });

  const onSubmit = (values: RoundFormValues) => {
    if (isEdit && roundId) {
      update({ id: roundId, ...values }, { onSuccess: () => router.push("/admin/rounds") });
    } else {
      create(values, { onSuccess: () => router.push("/admin/rounds") });
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
          {isEdit ? "Edit Round" : "Create Round"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}
      >
        <div className="flex flex-col">
          <label style={labelStyle}>Hackathon</label>
          <select {...register("hackathonId")} style={inputStyle}>
            <option value="">Select hackathon</option>
            {hackathonsData?.data.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          {errors.hackathonId && <span style={errorStyle}>{errors.hackathonId.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Name</label>
          <input {...register("name")} style={inputStyle} placeholder="Round name" />
          {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Description</label>
          <textarea {...register("description")} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Round description" />
          {errors.description && <span style={errorStyle}>{errors.description.message}</span>}
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Type</label>
          <select {...register("type")} style={inputStyle}>
            <option value="">Select type</option>
            <option value="ASYNC">Async</option>
            <option value="LIVE">Live</option>
          </select>
          {errors.type && <span style={errorStyle}>{errors.type.message}</span>}
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
          <label style={labelStyle}>Submission Deadline</label>
          <input type="date" {...register("submissionDeadline")} style={inputStyle} />
          {errors.submissionDeadline && <span style={errorStyle}>{errors.submissionDeadline.message}</span>}
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
            onClick={() => router.push("/admin/rounds")}
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
