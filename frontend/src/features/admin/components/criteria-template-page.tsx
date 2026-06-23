"use client";

import { useState } from "react";
import {
  useCriteriaTemplates,
  useCreateCriteriaTemplate,
  useDeleteCriteriaTemplate,
} from "@/features/admin/hooks/use-admin-criteria";
import type { ScoringTemplateResponse, ScoringTemplateCriterionResponse } from "@/lib/api";

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

function blockInvalidKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["-", "+", "e", "E", "."].includes(e.key)) e.preventDefault();
}

function TemplateRow({ t, onDelete, expanded, onToggle }: {
  t: ScoringTemplateResponse;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)", cursor: "pointer" }} onClick={onToggle}>
        <td style={{ ...bodyCell, fontWeight: 600 }}>{t.name}</td>
        <td style={bodyCell}>{t.criteria.length}</td>
        <td style={bodyCell}>
          {t.criteria.reduce((sum: number, c: ScoringTemplateCriterionResponse) => sum + c.weight, 0)}%
        </td>
        <td style={bodyCell}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
          >
            Delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} style={{ padding: "0 16px 16px 16px" }}>
            <div style={{ backgroundColor: "#f8f9fc", borderRadius: 8, padding: 16, marginTop: 4 }}>
              {t.description && <p style={{ fontSize: 13, color: "#4a5468", marginBottom: 12 }}>{t.description}</p>}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCell, backgroundColor: "transparent" }}>Criterion</th>
                    <th style={{ ...headerCell, backgroundColor: "transparent", width: 100 }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {t.criteria.map((c: ScoringTemplateCriterionResponse) => (
                    <tr key={c.id} style={{ borderTop: "1px solid rgba(198,198,205,0.2)" }}>
                      <td style={{ ...bodyCell, fontSize: 13 }}>{c.name}</td>
                      <td style={{ ...bodyCell, fontSize: 13, fontWeight: 600 }}>{c.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface CriterionForm { name: string; description: string; weight: number }

function CreateForm({ onClose }: { onClose: () => void }) {
  const { mutate: create, isPending } = useCreateCriteriaTemplate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<CriterionForm[]>([
    { name: "", description: "", weight: 0 },
  ]);

  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = totalWeight === 100;

  const addCriterion = () => setCriteria([...criteria, { name: "", description: "", weight: 0 }]);

  const updateCriterion = (idx: number, field: keyof CriterionForm, value: string | number) => {
    setCriteria(criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCriterion = (idx: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) return;
    create(
      { name, description: description || undefined, criteria: criteria.map((c, i) => ({ ...c, sortOrder: i })) },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24, marginBottom: 24 }}>
      <div className="flex flex-col">
        <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Template Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Template name" required />
      </div>

      <div className="flex flex-col">
        <label style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>Description (optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Description" />
      </div>

      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Criteria</p>
          <p style={{
            fontSize: 13, fontWeight: 700,
            color: isWeightValid ? "#10b981" : "#ef4444",
          }}>
            Total: {totalWeight}/100%
          </p>
        </div>

        {!isWeightValid && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            padding: "8px 12px", marginBottom: 8, fontSize: 13, color: "#991b1b",
          }}>
            Total weight must equal exactly 100%. Currently: {totalWeight}%
          </div>
        )}

        {criteria.map((c, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2" style={{ marginBottom: 8 }}>
            <div className="col-span-4">
              <input value={c.name} onChange={(e) => updateCriterion(idx, "name", e.target.value)} style={inputStyle} placeholder="Name" required />
            </div>
            <div className="col-span-5">
              <input value={c.description} onChange={(e) => updateCriterion(idx, "description", e.target.value)} style={inputStyle} placeholder="Description" />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                value={c.weight || ""}
                onChange={(e) => updateCriterion(idx, "weight", Math.max(0, parseInt(e.target.value) || 0))}
                onKeyDown={blockInvalidKeys}
                style={inputStyle}
                placeholder="Weight %"
                min={1}
                max={100}
                required
              />
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
        <button
          type="submit"
          disabled={isPending || !isWeightValid}
          className="rounded-lg"
          style={{
            backgroundColor: isWeightValid ? "#38bdf8" : "#9ca3af",
            padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600,
            border: "none", cursor: isWeightValid ? "pointer" : "not-allowed",
            opacity: isPending ? 0.7 : 1,
          }}
        >
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
  const { data: templates = [], isLoading } = useCriteriaTemplates();
  const { mutate: remove } = useDeleteCriteriaTemplate();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ padding: 24 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
            Scoring Criteria Templates
          </h1>
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
            Create and manage scoring criteria templates. Weights must sum to 100%.
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
              <th style={{ ...headerCell, width: 120 }}>Total Weight</th>
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
              : (templates as ScoringTemplateResponse[]).map((t) => (
                  <TemplateRow
                    key={t.id}
                    t={t}
                    onDelete={(id) => remove(id)}
                    expanded={expandedId === t.id}
                    onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  />
                ))
            }
            {!isLoading && templates.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No templates yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
