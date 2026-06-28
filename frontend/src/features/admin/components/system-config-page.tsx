"use client";

import { useState } from "react";
import { useSystemConfig, useUpdateSystemConfig } from "@/features/admin/hooks/use-admin-system";
import type { SystemConfigResponse } from "@/lib/api/system-config.api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

interface SystemConfigForm {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string;
  minTeams: string;
  maxTeams: string;
}

function formFromConfig(data: SystemConfigResponse): SystemConfigForm {
  return {
    minTeamMembers: data.minTeamMembers ?? 3,
    maxTeamMembers: data.maxTeamMembers ?? 5,
    defaultRules: data.defaultRules ?? "",
    minTeams: data.minTeams != null ? String(data.minTeams) : "",
    maxTeams: data.maxTeams != null ? String(data.maxTeams) : "",
  };
}

function SystemConfigForm({ data }: { data: SystemConfigResponse }) {
  const { mutate: update, isPending } = useUpdateSystemConfig();

  const [form, setForm] = useState<SystemConfigForm>(() => formFromConfig(data));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (key: keyof SystemConfigForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const parseOptionalTeamLimit = (value: string): number | null => {
    if (value.trim() === "") return null;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
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

    const minTeams = parseOptionalTeamLimit(form.minTeams);
    const maxTeams = parseOptionalTeamLimit(form.maxTeams);

    if (form.minTeams.trim() !== "" && minTeams === null) {
      setError("Min teams must be a valid number");
      return;
    }
    if (form.maxTeams.trim() !== "" && maxTeams === null) {
      setError("Max teams must be a valid number");
      return;
    }
    if (minTeams != null && minTeams < 0) {
      setError("Min teams cannot be negative");
      return;
    }
    if (maxTeams != null && maxTeams < 0) {
      setError("Max teams cannot be negative");
      return;
    }
    if (minTeams != null && maxTeams != null && minTeams > maxTeams) {
      setError("Minimum teams cannot exceed maximum teams");
      return;
    }

    update(
      {
        minTeamMembers: form.minTeamMembers,
        maxTeamMembers: form.maxTeamMembers,
        defaultRules: form.defaultRules,
        minTeams,
        maxTeams,
      },
      {
        onSuccess: () => {
          setSuccess("Settings saved successfully.");
          setError(null);
        },
        onError: (err: unknown) => {
          setSuccess(null);
          setError(err instanceof Error ? err.message : "Failed to save settings.");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-[720px] border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      {error && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", fontSize: 13, color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
          padding: "10px 14px", fontSize: 13, color: "#166534",
        }}>
          {success}
        </div>
      )}

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", marginBottom: 12 }}>Team Members (per team)</p>
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
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", marginBottom: 12 }}>Event Team Limits</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Min Teams (for event to run)</label>
            <input
              type="number"
              value={form.minTeams}
              onChange={(e) => handleChange("minTeams", e.target.value)}
              style={inputStyle}
              min={0}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Max Teams (close registration)</label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) => handleChange("maxTeams", e.target.value)}
              style={inputStyle}
              min={0}
              placeholder="Optional"
            />
          </div>
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
        className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
      >
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

export function SystemConfigPage() {
  const { data, isLoading, isError, error: loadError } = useSystemConfig();

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="animate-pulse rounded" style={{ height: 24, width: 300, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", fontSize: 14, color: "#991b1b", maxWidth: 720,
        }}>
          Failed to load system configuration: {loadError instanceof Error ? loadError.message : "Unknown error"}
        </div>
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
          Platform-wide settings for team sizes, event team limits, and default rules.
        </p>
      </div>

      <SystemConfigForm key={data.id} data={data} />
    </div>
  );
}
