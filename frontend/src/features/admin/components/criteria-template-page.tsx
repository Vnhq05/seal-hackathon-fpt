"use client";

import { useState } from "react";
import {
  useCriteriaTemplates,
  useCreateCriteriaTemplate,
  useUpdateCriteriaTemplate,
  useDeleteCriteriaTemplate,
} from "@/features/admin/hooks/use-admin-criteria";
import type { ScoringTemplateResponse, ScoringTemplateCriterionResponse } from "@/lib/api";
import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE } from "@/features/judging/constants/scoring-scale";

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
  if (["-", "+", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
}

function parsePositiveWeight(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  const parsed = parseInt(digits, 10);
  if (parsed <= 0) return undefined;
  return Math.min(parsed, 100);
}

interface CriterionForm {
  name: string;
  description: string;
  weight?: number;
  minScore: number;
  maxScore: number;
}

function emptyCriterion(): CriterionForm {
  return { name: "", description: "", weight: undefined, minScore: DEFAULT_MIN_SCORE, maxScore: DEFAULT_MAX_SCORE };
}

function criteriaFromTemplate(template: ScoringTemplateResponse): CriterionForm[] {
  return template.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? "",
    weight: c.weight,
    minScore: c.minScore ?? DEFAULT_MIN_SCORE,
    maxScore: c.maxScore ?? DEFAULT_MAX_SCORE,
  }));
}

function TemplateRow({ t, onDelete, onEdit, expanded, onToggle }: {
  t: ScoringTemplateResponse;
  onDelete: (id: string) => void;
  onEdit: (template: ScoringTemplateResponse) => void;
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
          <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(t)}
              style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", background: "none", border: "none", cursor: "pointer" }}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(t.id)}
              style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
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
                    <th style={{ ...headerCell, backgroundColor: "transparent", width: 80 }}>Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {t.criteria.map((c: ScoringTemplateCriterionResponse) => (
                    <tr key={c.id} style={{ borderTop: "1px solid rgba(198,198,205,0.2)" }}>
                      <td style={{ ...bodyCell, fontSize: 13 }}>{c.name}</td>
                      <td style={{ ...bodyCell, fontSize: 13, fontWeight: 600 }}>{c.weight}%</td>
                      <td style={{ ...bodyCell, fontSize: 13, color: "#8891a5" }}>
                        {c.minScore}–{c.maxScore}
                      </td>
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

function TemplateForm({
  template,
  onClose,
}: {
  template?: ScoringTemplateResponse;
  onClose: () => void;
}) {
  const isEdit = !!template;
  const { mutate: create, isPending: isCreating } = useCreateCriteriaTemplate();
  const { mutate: update, isPending: isUpdating } = useUpdateCriteriaTemplate();

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [criteria, setCriteria] = useState<CriterionForm[]>(
    template ? criteriaFromTemplate(template) : [emptyCriterion()]
  );
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPending = isCreating || isUpdating;
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight ?? 0), 0);
  const allWeightsPositive = criteria.every((c) => c.weight !== undefined && c.weight > 0);
  const isWeightValid = totalWeight === 100 && allWeightsPositive;

  const addCriterion = () => setCriteria([...criteria, emptyCriterion()]);

  const updateCriterion = (idx: number, field: keyof CriterionForm, value: string | number | undefined) => {
    setDeleteWarning(null);
    setCriteria(criteria.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const removeCriterion = (idx: number) => {
    if (criteria.length <= 1) return;

    const remaining = criteria.filter((_, i) => i !== idx);
    const newTotal = remaining.reduce((sum, c) => sum + (c.weight ?? 0), 0);

    if (newTotal !== 100) {
      setDeleteWarning(
        `After deletion, total weight will be ${newTotal}% (not 100%). Please adjust the remaining criteria weights before saving.`
      );
    } else {
      setDeleteWarning(null);
    }

    setCriteria(remaining);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) return;

    setSubmitError(null);

    const payload = {
      name,
      description: description || undefined,
      criteria: criteria.map((c, i) => ({
        name: c.name,
        description: c.description || undefined,
        weight: c.weight!,
        sortOrder: i,
        minScore: c.minScore,
        maxScore: c.maxScore,
      })),
    };

    const onError = (err: unknown) => {
      setSubmitError(err instanceof Error ? err.message : "Failed to save template.");
    };

    if (isEdit) {
      update({ id: template.id, ...payload }, { onSuccess: onClose, onError });
    } else {
      create(payload, { onSuccess: onClose, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>
        {isEdit ? "Edit Template" : "Create Template"}
      </h2>

      {submitError && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", fontSize: 13, color: "#991b1b",
        }}>
          {submitError}
        </div>
      )}

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
            Total weight must equal exactly 100%. Current: {totalWeight}%
            {!allWeightsPositive && " — each criterion needs a positive integer weight > 0."}
          </div>
        )}

        {deleteWarning && (
          <div style={{
            backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
            padding: "8px 12px", marginBottom: 8, fontSize: 13, color: "#9a3412",
          }}>
            {deleteWarning}
          </div>
        )}

        {criteria.map((c, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2" style={{ marginBottom: 8 }}>
            <div className="col-span-3">
              <input value={c.name} onChange={(e) => updateCriterion(idx, "name", e.target.value)} style={inputStyle} placeholder="Name" required />
            </div>
            <div className="col-span-4">
              <input value={c.description} onChange={(e) => updateCriterion(idx, "description", e.target.value)} style={inputStyle} placeholder="Description" />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[1-9][0-9]*"
                value={c.weight ?? ""}
                onChange={(e) => updateCriterion(idx, "weight", parsePositiveWeight(e.target.value))}
                onKeyDown={blockInvalidKeys}
                style={inputStyle}
                placeholder="Weight %"
                required
              />
            </div>
            <div className="col-span-1">
              <input
                type="number"
                min={1}
                value={c.minScore}
                onChange={(e) => updateCriterion(idx, "minScore", Number(e.target.value))}
                style={inputStyle}
                placeholder="Min"
                required
              />
            </div>
            <div className="col-span-1">
              <input
                type="number"
                min={c.minScore + 1}
                value={c.maxScore}
                onChange={(e) => updateCriterion(idx, "maxScore", Number(e.target.value))}
                style={inputStyle}
                placeholder="Max"
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
          className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
          style={{
            backgroundColor: isWeightValid ? "#38bdf8" : "#9ca3af",
            padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600,
            border: "none", cursor: isWeightValid ? "pointer" : "not-allowed",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
        </button>
        <button type="button" onClick={onClose} className="border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CriteriaTemplatePage() {
  const { data: templates = [], isLoading, isError, error, refetch } = useCriteriaTemplates();
  const { mutate: remove } = useDeleteCriteriaTemplate();
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingTemplate, setEditingTemplate] = useState<ScoringTemplateResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const closeForm = () => {
    setFormMode("closed");
    setEditingTemplate(null);
  };

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
        {formMode === "closed" && (
          <button
            onClick={() => setFormMode("create")}
            className="flex items-center justify-center border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
          >
            Create Template
          </button>
        )}
      </div>

      {formMode === "create" && <TemplateForm onClose={closeForm} />}
      {formMode === "edit" && editingTemplate && (
        <TemplateForm template={editingTemplate} onClose={closeForm} />
      )}

      {isError && (
        <div className="flex items-center justify-between" style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#991b1b",
        }}>
          <span>{error?.message || "Failed to load scoring templates."}</span>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              fontSize: 13, fontWeight: 600, color: "#991b1b",
              backgroundColor: "#ffffff", border: "1px solid #fecaca",
              borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Template Name</th>
              <th style={{ ...headerCell, width: 120 }}>Criteria Count</th>
              <th style={{ ...headerCell, width: 120 }}>Total Weight</th>
              <th style={{ ...headerCell, width: 140 }}>Actions</th>
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
              : !isError && (templates as ScoringTemplateResponse[]).map((t) => (
                  <TemplateRow
                    key={t.id}
                    t={t}
                    onDelete={(id) => remove(id)}
                    onEdit={(template) => {
                      setEditingTemplate(template);
                      setFormMode("edit");
                    }}
                    expanded={expandedId === t.id}
                    onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  />
                ))
            }
            {!isLoading && !isError && templates.length === 0 && (
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
