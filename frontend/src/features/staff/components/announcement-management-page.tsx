"use client";

import { useState } from "react";
import {
  useStaffAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/features/staff/hooks/use-staff-announcements";
import type { Announcement, AnnouncementPayload, AnnouncementStatus, AnnouncementAudience } from "@/features/staff/types/staff.types";

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
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function AnnouncementRow({
  item, onEdit, onDelete,
}: { item: Announcement; onEdit: (a: Announcement) => void; onDelete: (id: string) => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{item.title}</td>
      <td style={bodyCell}>
        <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ffffff", color: "#2dd4bf" }}>
          {item.audience}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>
        {item.publishedDate ? new Date(item.publishedDate).toLocaleDateString() : "—"}
      </td>
      <td style={bodyCell}><StatusBadge status={item.status} /></td>
      <td style={bodyCell}>
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="rounded-md px-3 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "none", cursor: "pointer" }}>Edit</button>
          <button onClick={() => onDelete(item.id)} className="rounded-md px-3 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#fef2f2", color: "#dc2626", border: "none", cursor: "pointer" }}>Delete</button>
        </div>
      </td>
    </tr>
  );
}

const AUDIENCES: AnnouncementAudience[] = ["all", "participants", "mentors", "judges", "staff"];
const EMPTY_PAYLOAD: AnnouncementPayload = { title: "", content: "", audience: "all", status: "draft" };

function AnnouncementForm({
  initial, onSubmit, onCancel, isPending,
}: { initial: AnnouncementPayload; onSubmit: (p: AnnouncementPayload) => void; onCancel: () => void; isPending: boolean }) {
  const [form, setForm] = useState<AnnouncementPayload>(initial);
  const set = (k: keyof AnnouncementPayload, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ ...cardStyle, maxWidth: 560, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 20 }}>
        {initial.title ? "Edit Announcement" : "Create Announcement"}
      </h3>
      <div className="flex flex-col gap-4">
        <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><label style={labelStyle}>Content *</label><textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} value={form.content} onChange={(e) => set("content", e.target.value)} /></div>
        <div>
          <label style={labelStyle}>Audience</label>
          <select style={inputStyle} value={form.audience} onChange={(e) => set("audience", e.target.value)}>
            {AUDIENCES.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
        </div>
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
          onClick={() => onSubmit(form)} disabled={!form.title || !form.content || isPending}
          className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#ffffff", color: "#0e1528", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

export function AnnouncementManagementPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "all">("all");
  const { data, isLoading } = useStaffAnnouncements({ page, pageSize: 10, status: statusFilter === "all" ? undefined : statusFilter });
  const { mutate: create, isPending: creating } = useCreateAnnouncement();
  const { mutate: update, isPending: updating } = useUpdateAnnouncement();
  const { mutate: del } = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);

  const announcements = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const handleEdit = (a: Announcement) => { setEditItem(a); setShowForm(true); };
  const handleCreate = () => { setEditItem(null); setShowForm(true); };
  const handleSubmit = (payload: AnnouncementPayload) => {
    if (editItem) {
      update({ id: editItem.id, payload }, { onSuccess: () => setShowForm(false) });
    } else {
      create(payload, { onSuccess: () => setShowForm(false) });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>Announcement Management</h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>Create and manage announcements for hackathon participants.</p>
        </div>
        <button onClick={handleCreate} className="rounded-lg" style={{ padding: "8px 20px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}>
          + Create Announcement
        </button>
      </div>

      {showForm && (
        <AnnouncementForm
          initial={editItem ? { title: editItem.title, content: editItem.content, audience: editItem.audience, status: editItem.status } : EMPTY_PAYLOAD}
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

      {!isLoading && announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No announcements yet</p>
          <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Create your first announcement.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Title</th>
                <th style={{ ...headerCell, width: 120 }}>Audience</th>
                <th style={headerCell}>Published Date</th>
                <th style={{ ...headerCell, width: 100 }}>Status</th>
                <th style={{ ...headerCell, width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                : announcements.map((a) => <AnnouncementRow key={a.id} item={a} onEdit={handleEdit} onDelete={(id) => del(id)} />)
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
