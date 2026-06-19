"use client";

import { useState } from "react";
import { useStaffAwards, useCreateAward, useUpdateAward, useDeleteAward } from "@/features/staff/hooks/use-staff-awards";
import type { Award, AwardPayload, AwardStatus } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", marginBottom: 6, display: "block",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8, outline: "none", color: "#0e1528", backgroundColor: "#ffffff",
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderRadius: 12,
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)", padding: 24,
};

const statusColors: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#eef0f6", color: "#2dd4bf" },
  published: { bg: "#ecfdf5", color: "#047857" },
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? { bg: "#eef0f6", color: "#2dd4bf" };
  return (
    <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function AwardRow({ award, onEdit, onDelete }: { award: Award; onEdit: (a: Award) => void; onDelete: (id: string) => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{award.name}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{award.hackathonName}</td>
      <td style={bodyCell}>{award.trackName ?? "—"}</td>
      <td style={bodyCell}>{award.teamName ?? "—"}</td>
      <td style={bodyCell}>{award.prize}</td>
      <td style={bodyCell}><StatusBadge status={award.status} /></td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <button onClick={() => onEdit(award)} className="rounded-md px-3 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "none", cursor: "pointer" }}>Edit</button>
          <button onClick={() => onDelete(award.id)} className="rounded-md px-3 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#fef2f2", color: "#dc2626", border: "none", cursor: "pointer" }}>Delete</button>
        </div>
      </td>
    </tr>
  );
}

const EMPTY_PAYLOAD: AwardPayload = { name: "", hackathonId: "", prize: "", status: "draft" };

function AwardForm({
  initial, onSubmit, onCancel, isPending,
}: { initial: AwardPayload; onSubmit: (p: AwardPayload) => void; onCancel: () => void; isPending: boolean }) {
  const [form, setForm] = useState<AwardPayload>(initial);
  const set = (k: keyof AwardPayload, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ ...cardStyle, maxWidth: 560, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 20 }}>
        {initial.name ? "Edit Award" : "Create Award"}
      </h3>
      <div className="flex flex-col gap-4">
        <div><label style={labelStyle}>Award Name *</label><input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><label style={labelStyle}>Hackathon ID *</label><input style={inputStyle} value={form.hackathonId} onChange={(e) => set("hackathonId", e.target.value)} /></div>
        <div><label style={labelStyle}>Track ID</label><input style={inputStyle} value={form.trackId ?? ""} onChange={(e) => set("trackId", e.target.value)} /></div>
        <div><label style={labelStyle}>Team ID</label><input style={inputStyle} value={form.teamId ?? ""} onChange={(e) => set("teamId", e.target.value)} /></div>
        <div><label style={labelStyle}>Prize *</label><input style={inputStyle} value={form.prize} onChange={(e) => set("prize", e.target.value)} /></div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSubmit(form)} disabled={!form.name || !form.hackathonId || !form.prize || isPending}
          className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

export function AwardManagementPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AwardStatus | "all">("all");
  const { data, isLoading } = useStaffAwards({ page, pageSize: 10, status: statusFilter === "all" ? undefined : statusFilter });
  const { mutate: create, isPending: creating } = useCreateAward();
  const { mutate: update, isPending: updating } = useUpdateAward();
  const { mutate: del } = useDeleteAward();

  const [showForm, setShowForm] = useState(false);
  const [editAward, setEditAward] = useState<Award | null>(null);

  const awards = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const handleEdit = (a: Award) => {
    setEditAward(a);
    setShowForm(true);
  };
  const handleCreate = () => {
    setEditAward(null);
    setShowForm(true);
  };
  const handleSubmit = (payload: AwardPayload) => {
    if (editAward) {
      update({ id: editAward.id, payload }, { onSuccess: () => setShowForm(false) });
    } else {
      create(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>Award Management</h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>Create and manage hackathon awards.</p>
        </div>
        <button onClick={handleCreate} className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}>
          + Create Award
        </button>
      </div>

      {showForm && (
        <AwardForm
          initial={editAward ? { name: editAward.name, hackathonId: editAward.hackathonId, trackId: editAward.trackName ?? undefined, teamId: editAward.teamId ?? undefined, prize: editAward.prize, status: editAward.status } : EMPTY_PAYLOAD}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          isPending={creating || updating}
        />
      )}

      <div className="flex gap-1 mb-4">
        {(["all", "draft", "published"] as const).map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className="rounded-md px-3 py-1"
            style={{ fontSize: 12, fontWeight: statusFilter === s ? 700 : 500, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: statusFilter === s ? "#0e1528" : "#ffffff", color: statusFilter === s ? "#ffffff" : "#8891a5", cursor: "pointer" }}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {!isLoading && awards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No awards yet</p>
          <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Create your first award to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Award Name</th>
                <th style={headerCell}>Hackathon</th>
                <th style={headerCell}>Track</th>
                <th style={headerCell}>Team</th>
                <th style={headerCell}>Prize</th>
                <th style={{ ...headerCell, width: 100 }}>Status</th>
                <th style={{ ...headerCell, width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : awards.map((a) => <AwardRow key={a.id} award={a} onEdit={handleEdit} onDelete={(id) => del(id)} />)
              }
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "#8891a5" }}>Page {page} of {totalPages} ({total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md px-3 py-1" style={{ fontSize: 12, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
