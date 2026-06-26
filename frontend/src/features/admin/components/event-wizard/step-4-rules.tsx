"use client";

import { useSystemConfig } from "@/features/admin/hooks/use-admin-system";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };

export function Step4Rules({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data: config } = useSystemConfig();

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
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Min Teams (for event to run)</label>
            <input value={config?.minTeams ?? "—"} disabled style={{ ...inputStyle, backgroundColor: "#eef0f6", color: "#8891a5" }} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "#8891a5" }}>Max Teams (close registration)</label>
            <input value={config?.maxTeams ?? "—"} disabled style={{ ...inputStyle, backgroundColor: "#eef0f6", color: "#8891a5" }} />
          </div>
        </div>
      </div>

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
        <button onClick={onNext} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
