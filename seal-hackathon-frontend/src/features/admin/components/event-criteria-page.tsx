"use client";

import { useState } from "react";
import { useAdminHackathons } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRounds } from "@/features/admin/hooks/use-admin-rounds";
import { useCriteriaTemplates, useEventCriteria, useSaveEventCriteria } from "@/features/admin/hooks/use-admin-criteria";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

export function EventCriteriaPage() {
  const [hackathonId, setHackathonId] = useState("");
  const [roundId, setRoundId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [overrides, setOverrides] = useState<{ criterionName: string; weight: number }[]>([]);

  const { data: hackathonsData } = useAdminHackathons();
  const { data: roundsData } = useAdminRounds(hackathonId || undefined);
  const { data: templatesData } = useCriteriaTemplates();
  const { data: existing } = useEventCriteria(hackathonId, roundId);
  const { mutate: save, isPending } = useSaveEventCriteria();

  const selectedTemplate = templatesData?.data.find((t) => t.id === templateId);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = templatesData?.data.find((t) => t.id === id);
    if (tpl) {
      setOverrides(tpl.criteria.map((c) => ({ criterionName: c.name, weight: c.weight })));
    }
  };

  const updateWeight = (idx: number, weight: number) => {
    setOverrides(overrides.map((o, i) => (i === idx ? { ...o, weight } : o)));
  };

  const handleSave = () => {
    if (!hackathonId || !roundId || !templateId) return;
    save({ hackathonId, roundId, templateId, overrides });
  };

  // Sync existing config
  if (existing && !templateId && existing.templateId) {
    setTemplateId(existing.templateId);
    setOverrides(existing.overrides);
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Event Criteria Configuration
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign criteria templates to hackathon rounds and override weights.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Hackathon</label>
            <select value={hackathonId} onChange={(e) => { setHackathonId(e.target.value); setRoundId(""); }} style={inputStyle}>
              <option value="">Select</option>
              {hackathonsData?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Round</label>
            <select value={roundId} onChange={(e) => setRoundId(e.target.value)} style={inputStyle} disabled={!hackathonId}>
              <option value="">Select</option>
              {roundsData?.data.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Template</label>
            <select value={templateId} onChange={(e) => handleTemplateChange(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              {templatesData?.data.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {selectedTemplate && overrides.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 12 }}>Weight Overrides</p>
            <div className="overflow-hidden rounded-lg" style={{ border: "1px solid rgba(198,198,205,0.5)" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eef0f6" }}>
                    <th style={headerCell}>Criterion</th>
                    <th style={{ ...headerCell, width: 120 }}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((o, idx) => (
                    <tr key={o.criterionName} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                      <td style={bodyCell}>{o.criterionName}</td>
                      <td style={bodyCell}>
                        <input
                          type="number"
                          value={o.weight}
                          onChange={(e) => updateWeight(idx, Number(e.target.value))}
                          style={{ ...inputStyle, width: 80 }}
                          min={0}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isPending || !hackathonId || !roundId || !templateId}
          className="rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: isPending ? 0.7 : 1, width: "fit-content" }}
        >
          {isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
