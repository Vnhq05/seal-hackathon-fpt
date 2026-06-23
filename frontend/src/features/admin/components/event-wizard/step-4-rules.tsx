"use client";

import { useState } from "react";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";
import { useSystemConfig } from "@/features/admin/hooks/use-admin-system";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

export function Step4Rules({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const { data: config } = useSystemConfig();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};

    if (data.minTeam != null && data.minTeam < 0) {
      errs.minTeam = "Min teams cannot be negative";
    }
    if (data.maxTeam != null && data.maxTeam < 0) {
      errs.maxTeam = "Max teams cannot be negative";
    }
    if (data.minTeam != null && data.maxTeam != null && data.minTeam > data.maxTeam) {
      errs.minTeam = "Min teams must be less than or equal to max teams";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const minMaxWarning =
    data.minTeam != null && data.maxTeam != null && data.minTeam > data.maxTeam
      ? "Min teams is greater than max teams"
      : null;

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 4: Rules & Team Config</h2>

      <div style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", marginBottom: 8 }}>System Configuration (read-only)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Min Members/Team</label>
            <input value={config?.minTeamMembers ?? 3} disabled style={{ ...inputStyle, backgroundColor: "#eef0f6", color: "#8891a5" }} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Max Members/Team</label>
            <input value={config?.maxTeamMembers ?? 5} disabled style={{ ...inputStyle, backgroundColor: "#eef0f6", color: "#8891a5" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Min Teams (for event to run)</label>
          <input
            type="number"
            value={data.minTeam ?? ""}
            onChange={(e) => updateData({ minTeam: e.target.value ? parseInt(e.target.value) : null })}
            style={{ ...inputStyle, borderColor: errors.minTeam ? "#ef4444" : undefined }}
            min={0}
            placeholder="Minimum teams"
          />
          {errors.minTeam && <p style={errorStyle}>{errors.minTeam}</p>}
        </div>
        <div>
          <label style={labelStyle}>Max Teams (close registration)</label>
          <input
            type="number"
            value={data.maxTeam ?? ""}
            onChange={(e) => updateData({ maxTeam: e.target.value ? parseInt(e.target.value) : null })}
            style={{ ...inputStyle, borderColor: errors.maxTeam ? "#ef4444" : undefined }}
            min={0}
            placeholder="Maximum teams"
          />
          {errors.maxTeam && <p style={errorStyle}>{errors.maxTeam}</p>}
        </div>
      </div>

      {minMaxWarning && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "8px 12px", fontSize: 12, color: "#991b1b",
        }}>
          {minMaxWarning}
        </div>
      )}

      {config?.defaultRules && (
        <div>
          <label style={{ ...labelStyle, color: "#8891a5" }}>System Rules (read-only)</label>
          <div style={{ padding: 12, backgroundColor: "#f8f9fc", borderRadius: 8, fontSize: 13, color: "#4a5468", whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
            {config.defaultRules}
          </div>
        </div>
      )}

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Back</button>
        <button onClick={() => { if (validate()) onNext(); }} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
