"use client";

import { useState } from "react";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

export function Step1Name({ onNext }: { onNext: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentYear = new Date().getFullYear();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.season.trim()) errs.season = "Season is required";
    else if (!/^[a-zA-Z\s]+$/.test(data.season)) errs.season = "Season must contain only letters";
    if (!data.year) errs.year = "Year is required";
    else if (data.year < currentYear) errs.year = `Year must be ${currentYear} or later`;
    if (!data.name.trim()) errs.name = "Event name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 1: Event Name & Season</h2>

      <div>
        <label style={labelStyle}>Season</label>
        <input
          value={data.season}
          onChange={(e) => updateData({ season: e.target.value })}
          style={{ ...inputStyle, borderColor: errors.season ? "#ef4444" : undefined }}
          placeholder="e.g. Spring, Fall, Summer"
        />
        {errors.season && <p style={errorStyle}>{errors.season}</p>}
      </div>

      <div>
        <label style={labelStyle}>Year</label>
        <input
          type="number"
          value={data.year || ""}
          onChange={(e) => updateData({ year: parseInt(e.target.value) || 0 })}
          onKeyDown={(e) => { if (["-", "+", "e", "E", "."].includes(e.key)) e.preventDefault(); }}
          style={{ ...inputStyle, borderColor: errors.year ? "#ef4444" : undefined }}
          min={currentYear}
          placeholder={String(currentYear)}
        />
        {errors.year && <p style={errorStyle}>{errors.year}</p>}
      </div>

      <div>
        <label style={labelStyle}>Event Name</label>
        <input
          value={data.name}
          onChange={(e) => updateData({ name: e.target.value })}
          style={{ ...inputStyle, borderColor: errors.name ? "#ef4444" : undefined }}
          placeholder="Hackathon event name"
        />
        {errors.name && <p style={errorStyle}>{errors.name}</p>}
      </div>

      <div className="flex justify-end" style={{ marginTop: 8 }}>
        <button onClick={handleNext} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Next
        </button>
      </div>
    </div>
  );
}
