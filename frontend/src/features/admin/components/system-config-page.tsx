"use client";

import { useEffect, useState } from "react";
import { useSystemConfig, useUpdateSystemConfig } from "@/features/admin/hooks/use-admin-system";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

/** Local form state shape matching the placeholder hook return. */
interface SystemConfigForm {
  platformName: string;
  registrationOpen: boolean;
  maxTeamSize: number;
  emailTemplateWelcome: string;
  emailTemplateSubmission: string;
  featureFlagLeaderboard: boolean;
  featureFlagMentorPortal: boolean;
  featureFlagJudgePortal: boolean;
}

export function SystemConfigPage() {
  const { data, isLoading } = useSystemConfig();
  const { mutate: update, isPending } = useUpdateSystemConfig();

  const [form, setForm] = useState<SystemConfigForm>({
    platformName: "",
    registrationOpen: true,
    maxTeamSize: 5,
    emailTemplateWelcome: "",
    emailTemplateSubmission: "",
    featureFlagLeaderboard: true,
    featureFlagMentorPortal: true,
    featureFlagJudgePortal: true,
  });

  useEffect(() => {
    if (data) {
      setForm({
        platformName: data.platformName ?? "",
        registrationOpen: data.registrationOpen ?? true,
        maxTeamSize: data.maxTeamSize ?? 5,
        emailTemplateWelcome: data.emailTemplateWelcome ?? "",
        emailTemplateSubmission: data.emailTemplateSubmission ?? "",
        featureFlagLeaderboard: data.featureFlagLeaderboard ?? true,
        featureFlagMentorPortal: data.featureFlagMentorPortal ?? true,
        featureFlagJudgePortal: data.featureFlagJudgePortal ?? true,
      });
    }
  }, [data]);

  const handleChange = (key: keyof SystemConfigForm, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    update({ ...form } as Record<string, unknown>);
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
          Platform settings, email templates, and feature flags.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}>
        <div className="flex flex-col">
          <label style={labelStyle}>Platform Name</label>
          <input value={form.platformName} onChange={(e) => handleChange("platformName", e.target.value)} style={inputStyle} />
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Max Team Size</label>
          <input type="number" value={form.maxTeamSize} onChange={(e) => handleChange("maxTeamSize", Number(e.target.value))} style={inputStyle} />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
            <input type="checkbox" checked={form.registrationOpen} onChange={(e) => handleChange("registrationOpen", e.target.checked)} />
            Registration Open
          </label>
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Welcome Email Template</label>
          <textarea value={form.emailTemplateWelcome} onChange={(e) => handleChange("emailTemplateWelcome", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div className="flex flex-col">
          <label style={labelStyle}>Submission Confirmation Template</label>
          <textarea value={form.emailTemplateSubmission} onChange={(e) => handleChange("emailTemplateSubmission", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div>
          <p style={{ ...labelStyle, marginBottom: 12 }}>Feature Flags</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
              <input type="checkbox" checked={form.featureFlagLeaderboard} onChange={(e) => handleChange("featureFlagLeaderboard", e.target.checked)} />
              Leaderboard
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
              <input type="checkbox" checked={form.featureFlagMentorPortal} onChange={(e) => handleChange("featureFlagMentorPortal", e.target.checked)} />
              Mentor Portal
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
              <input type="checkbox" checked={form.featureFlagJudgePortal} onChange={(e) => handleChange("featureFlagJudgePortal", e.target.checked)} />
              Judge Portal
            </label>
          </div>
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
