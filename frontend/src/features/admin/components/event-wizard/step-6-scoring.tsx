"use client";

import { useState } from "react";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";
import { useCriteriaTemplates } from "@/features/admin/hooks/use-admin-criteria";
import type { ScoringTemplateResponse } from "@/lib/api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };

function TemplateCriteriaPreview({ template }: { template: ScoringTemplateResponse }) {
  const totalWeight = template.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div style={{ padding: 12, backgroundColor: "#f8f9fc", borderRadius: 8, marginTop: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1528" }}>{template.name}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>
          Total: {totalWeight}%
        </p>
      </div>
      {totalWeight !== 100 && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 10px", marginBottom: 6, fontSize: 11, color: "#991b1b" }}>
          Warning: Template weights do not sum to 100%
        </div>
      )}
      {template.criteria.map((c) => (
        <div key={c.id} className="flex items-center justify-between" style={{ padding: "4px 0", borderBottom: "1px solid rgba(223,226,236,0.3)" }}>
          <span style={{ fontSize: 12, color: "#0e1528" }}>{c.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5468" }}>{c.weight}%</span>
        </div>
      ))}
    </div>
  );
}

function TemplateSelect({
  value,
  onChange,
  templates,
  isLoading,
  isError,
  error,
  onRetry,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  templates: ScoringTemplateResponse[];
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <div className="animate-pulse rounded" style={{ height: 44, backgroundColor: "rgba(223,226,236,0.8)" }} />;
  }

  if (isError) {
    return (
      <div style={{
        backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
        padding: "10px 14px", fontSize: 13, color: "#991b1b",
      }}>
        <div className="flex items-center justify-between gap-3">
          <span>{error?.message || "Failed to load scoring templates."}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                fontSize: 12, fontWeight: 600, color: "#991b1b",
                backgroundColor: "#ffffff", border: "1px solid #fecaca",
                borderRadius: 6, padding: "4px 10px", cursor: "pointer", flexShrink: 0,
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      style={inputStyle}
    >
      <option value="">Select a template...</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}

export function Step6Scoring({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const { data: templates = [], isLoading, isError, error: loadError, refetch } = useCriteriaTemplates();
  const allTemplates = templates as ScoringTemplateResponse[];
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedSharedTemplate = allTemplates.find((t) => t.id === data.scoringTemplateId);

  const validate = () => {
    if (data.applyToAllTracks) {
      if (!data.scoringTemplateId) {
        setValidationError("Please select a scoring template");
        return false;
      }
    } else if (data.tracks.some((t) => !t.scoringTemplateId)) {
      setValidationError("Each track must have a scoring template assigned");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleModeChange = (applyAll: boolean) => {
    if (applyAll) {
      const updatedTracks = data.tracks.map((t) => ({ ...t, scoringTemplateId: null }));
      updateData({ applyToAllTracks: true, tracks: updatedTracks });
    } else {
      updateData({ applyToAllTracks: false, scoringTemplateId: null });
    }
  };

  const handleTrackTemplateChange = (trackIndex: number, templateId: string | null) => {
    const updatedTracks = data.tracks.map((t, i) =>
      i === trackIndex ? { ...t, scoringTemplateId: templateId } : t
    );
    updateData({ tracks: updatedTracks });
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 660 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 6: Scoring</h2>

      {validationError && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
          {validationError}
        </div>
      )}

      <div>
        <label style={labelStyle}>Scoring Mode</label>
        <div className="flex gap-3" style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: data.applyToAllTracks
                ? "2px solid #38bdf8"
                : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: data.applyToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>
              Shared Template
            </p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>
              All tracks use the same scoring criteria
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: !data.applyToAllTracks
                ? "2px solid #38bdf8"
                : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: !data.applyToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>
              Per-Track Template
            </p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>
              Each track has its own scoring criteria
            </p>
          </button>
        </div>
      </div>

      {data.applyToAllTracks ? (
        <div>
          <label style={labelStyle}>Scoring Template</label>
          <TemplateSelect
            value={data.scoringTemplateId}
            onChange={(id) => updateData({ scoringTemplateId: id })}
            templates={allTemplates}
            isLoading={isLoading}
            isError={isError}
            error={loadError}
            onRetry={() => refetch()}
          />
          {selectedSharedTemplate && (
            <TemplateCriteriaPreview template={selectedSharedTemplate} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.tracks.length === 0 ? (
            <div style={{ padding: 16, backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
              No tracks configured. Go back to Step 2 to add tracks first.
            </div>
          ) : (
            data.tracks.map((track, idx) => {
              const trackTemplate = allTemplates.find((t) => t.id === track.scoringTemplateId);
              return (
                <div key={idx} style={{ padding: 16, backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderRadius: 10 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 8, backgroundColor: "#e0f2fe",
                      fontSize: 12, fontWeight: 700, color: "#0284c7",
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>{track.name}</span>
                    <span style={{ fontSize: 12, color: "#8891a5" }}>max {track.maxTeams} teams</span>
                  </div>
                  <TemplateSelect
                    value={track.scoringTemplateId}
                    onChange={(id) => handleTrackTemplateChange(idx, id)}
                    templates={allTemplates}
                    isLoading={isLoading}
                    isError={isError}
                    error={loadError}
                    onRetry={() => refetch()}
                  />
                  {trackTemplate && (
                    <TemplateCriteriaPreview template={trackTemplate} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Back</button>
        <button onClick={() => { if (validate()) onNext(); }} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
