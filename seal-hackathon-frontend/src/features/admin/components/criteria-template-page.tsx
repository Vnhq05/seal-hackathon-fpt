"use client";

import { useState } from "react";
import {
  useCriteriaTemplates,
  useCreateCriteriaTemplate,
  useDeleteCriteriaTemplate,
} from "@/features/admin/hooks/use-admin-criteria";
import type { CriteriaTemplate, CriterionItem } from "@/features/admin/types/admin-analytics.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};

function TemplateRow({ t, onDelete }: { t: CriteriaTemplate; onDelete: (id: string) => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{t.name}</td>
      <td style={bodyCell}>{t.criteria.length}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{t.usedIn.length > 0 ? t.usedIn.join(", ") : "None"}</td>
      <td style={bodyCell}>
        <button
          onClick={() => onDelete(t.id)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCriteriaTemplate();
  const [name, setName] = useState("");
  const [criteria, setCriteria] = useState<Omit<CriterionItem, "id">[]>([
    { name: "", description: "", weight: 1 },
  ]);

  const addCriterion = () => setCriteria([...criteria, { name: "", description: "", weight: 1 }]);

  const updateCriterion = (idx: number, field: string, value: string | number) => {
    setCriteria(criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCriterion = (idx: number) => setCriteria(criteria.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create({ name, criteria }, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24, marginBottom: 24 }}>
      <div className="flex flex-col">
        <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Template Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Template name" required />
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 8 }}>Criteria</p>
        {criteria.map((c, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2" style={{ marginBottom: 8 }}>
            <div className="col-span-4">
              <input value={c.name} onChange={(e) => updateCriterion(idx, "name", e.target.value)} style={inputStyle} placeholder="Name" required />
            </div>
            <div className="col-span-5">
              <input value={c.description} onChange={(e) => updateCriterion(idx, "description", e.target.value)} style={inputStyle} placeholder="Description" />
            </div>
            <div className="col-span-2">
              <input type="number" value={c.weight} onChange={(e) => updateCriterion(idx, "weight", Number(e.target.value))} style={inputStyle} placeholder="Weight" min={1} />
            </div>
            <div className="col-span-1 flex items-center">
              {criteria.length > 1 && (
                <button type="button" onClick={() => removeCriterion(idx)} style={{ fontSize: 18, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>
                  x
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="button" onClick={addCriterion} style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
          + Add Criterion
        </button>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1 }}>
          {isPending ? "Creating..." : "Create Template"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CriteriaTemplatePage() {
  const { data, isLoading } = useCriteriaTemplates();
  const { mutate: remove } = useDeleteCriteriaTemplate();
  const [showForm, setShowForm] = useState(false);
  const templates = data?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Judging Criteria Templates
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Create and manage criteria templates.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center rounded-lg"
            style={{ backgroundColor: "#38bdf8", padding: "10px 20px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Create Template
          </button>
        )}
      </div>

      {showForm && <CreateForm onClose={() => setShowForm(false)} />}

      <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Template Name</th>
              <th style={{ ...headerCell, width: 120 }}>Criteria Count</th>
              <th style={headerCell}>Used In</th>
              <th style={{ ...headerCell, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : templates.map((t) => <TemplateRow key={t.id} t={t} onDelete={(id) => remove(id)} />)
            }
            {!isLoading && templates.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No templates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
