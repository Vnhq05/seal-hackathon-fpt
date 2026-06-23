"use client";

import { useEffect, useState } from "react";
import { useSystemConfig, useUpdateSystemConfig } from "@/features/admin/hooks/use-admin-system";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

interface SystemConfigForm {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string;
}

export function SystemConfigPage() {
  const { data, isLoading } = useSystemConfig();
  const { mutate: update, isPending } = useUpdateSystemConfig();

  const [form, setForm] = useState<SystemConfigForm>({
    minTeamMembers: 3,
    maxTeamMembers: 5,
    defaultRules: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        minTeamMembers: data.minTeamMembers ?? 3,
        maxTeamMembers: data.maxTeamMembers ?? 5,
        defaultRules: data.defaultRules ?? "",
      });
    }
  }, [data]);

  const handleChange = (key: keyof SystemConfigForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSave = () => {
    if (form.minTeamMembers < 1 || form.maxTeamMembers < 1) {
      setError("Team members must be at least 1");
      return;
    }
    if (form.minTeamMembers > form.maxTeamMembers) {
      setError("Minimum members cannot exceed maximum members");
      return;
    }
    update({
      minTeamMembers: form.minTeamMembers,
      maxTeamMembers: form.maxTeamMembers,
      defaultRules: form.defaultRules || undefined,
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="animate-pulse rounded" style={{ height: 24, width: 300, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          System Configuration
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Platform-wide settings for team sizes and default rules.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}>
        {error && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            padding: "10px 14px", fontSize: 13, color: "#991b1b",
          }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Min Team Members</label>
            <input
              type="number"
              value={form.minTeamMembers}
              onChange={(e) => handleChange("minTeamMembers", Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
              min={1}
            />
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Max Team Members</label>
            <input
              type="number"
              value={form.maxTeamMembers}
              onChange={(e) => handleChange("maxTeamMembers", Math.max(1, parseInt(e.target.value) || 1))}
              style={inputStyle}
              min={1}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Default Rules</label>
          <textarea
            value={form.defaultRules}
            onChange={(e) => handleChange("defaultRules", e.target.value)}
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Enter default rules for all hackathon events..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", width: "fit-content", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
