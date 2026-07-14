"use client";

import { useState } from "react";
import { useSystemConfig, useUpdateSystemConfig } from "@/features/admin/hooks/use-admin-system";
import { AllowedEmailDomainsPanel } from "@/features/events/components/allowed-email-domains-panel";
import type { SystemConfigResponse } from "@/lib/api/system-config.api";
import { SealButton } from "@/shared/ui/seal-button";
import { SealCard } from "@/shared/ui/seal-card";

const inputClass =
  "w-full rounded-lg border border-seal-border/80 bg-white px-4 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-royal/20";
const labelClass = "mb-1.5 text-sm font-semibold text-navy";
const sectionTitleClass =
  "mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-seal-text-muted";

interface SystemConfigForm {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string;
  minTeams: string;
  maxTeams: string;
  semesterMin: string;
  semesterMax: string;
}

function formFromConfig(data: SystemConfigResponse): SystemConfigForm {
  return {
    minTeamMembers: data.minTeamMembers ?? 3,
    maxTeamMembers: data.maxTeamMembers ?? 5,
    defaultRules: data.defaultRules ?? "",
    minTeams: data.minTeams != null ? String(data.minTeams) : "",
    maxTeams: data.maxTeams != null ? String(data.maxTeams) : "",
    semesterMin: data.semesterMin != null ? String(data.semesterMin) : "",
    semesterMax: data.semesterMax != null ? String(data.semesterMax) : "",
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

  const parseOptionalSemester = (value: string): number | null => {
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

    const semesterMin = parseOptionalSemester(form.semesterMin);
    const semesterMax = parseOptionalSemester(form.semesterMax);

    if (form.semesterMin.trim() !== "" && semesterMin === null) {
      setError("Semester min must be a valid number");
      return;
    }
    if (form.semesterMax.trim() !== "" && semesterMax === null) {
      setError("Semester max must be a valid number");
      return;
    }
    if (semesterMin != null && (semesterMin < 1 || semesterMin > 10)) {
      setError("Semester min must be between 1 and 10");
      return;
    }
    if (semesterMax != null && (semesterMax < 1 || semesterMax > 10)) {
      setError("Semester max must be between 1 and 10");
      return;
    }
    if (semesterMin != null && semesterMax != null && semesterMin > semesterMax) {
      setError("Semester min cannot exceed semester max");
      return;
    }

    update(
      {
        minTeamMembers: form.minTeamMembers,
        maxTeamMembers: form.maxTeamMembers,
        defaultRules: form.defaultRules,
        minTeams,
        maxTeams,
        semesterMin,
        semesterMax,
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
    <SealCard className="space-y-7 p-5 sm:p-7">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-800">
          {success}
        </div>
      )}

      <section>
        <p className={sectionTitleClass}>Team Members (per team)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className={labelClass}>Min Team Members</label>
            <input
              type="number"
              value={form.minTeamMembers}
              onChange={(e) => handleChange("minTeamMembers", Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
              min={1}
            />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Max Team Members</label>
            <input
              type="number"
              value={form.maxTeamMembers}
              onChange={(e) => handleChange("maxTeamMembers", Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
              min={1}
            />
          </div>
        </div>
      </section>

      <section>
        <p className={sectionTitleClass}>Event Team Limits</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className={labelClass}>Min Teams (for event to run)</label>
            <input
              type="number"
              value={form.minTeams}
              onChange={(e) => handleChange("minTeams", e.target.value)}
              className={inputClass}
              min={0}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Max Teams (close registration)</label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) => handleChange("maxTeams", e.target.value)}
              className={inputClass}
              min={0}
              placeholder="Optional"
            />
          </div>
        </div>
      </section>

      <section>
        <p className={sectionTitleClass}>Semester Eligibility</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className={labelClass}>Semester Min (eligibility)</label>
            <input
              type="number"
              value={form.semesterMin}
              onChange={(e) => handleChange("semesterMin", e.target.value)}
              className={inputClass}
              min={1}
              max={10}
              placeholder="Optional"
            />
          </div>
          <div className="flex flex-col">
            <label className={labelClass}>Semester Max (eligibility)</label>
            <input
              type="number"
              value={form.semesterMax}
              onChange={(e) => handleChange("semesterMax", e.target.value)}
              className={inputClass}
              min={1}
              max={10}
              placeholder="Optional"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col">
        <label className={labelClass}>Default Rules</label>
        <textarea
          value={form.defaultRules}
          onChange={(e) => handleChange("defaultRules", e.target.value)}
          rows={8}
          className={`${inputClass} resize-y`}
          placeholder="Enter default rules for all hackathon events..."
        />
      </section>

      <div className="flex justify-end border-t-2 border-navy/10 pt-5">
        <SealButton
          type="button"
          className="!w-auto min-w-[140px]"
          disabled={isPending}
          isLoading={isPending}
          onClick={handleSave}
        >
          {isPending ? "Saving..." : "Save Settings"}
        </SealButton>
      </div>
    </SealCard>
  );
}

export function SystemConfigPage() {
  const { data, isLoading, isError, error: loadError } = useSystemConfig();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-4">
        <div className="mb-4 h-8 w-72 animate-pulse rounded bg-seal-border/80" />
        <div className="h-64 animate-pulse rounded bg-seal-border/80" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-2 py-6 sm:px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load system configuration:{" "}
          {loadError instanceof Error ? loadError.message : "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-2 sm:px-4">
      <header className="mb-8 border-b-2 border-navy/10 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-navy sm:text-[32px]">
          System Configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-seal-text-muted">
          Platform-wide settings for team sizes, event team limits, semester eligibility, default
          rules, and allowed email domains.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <SystemConfigForm key={data.id} data={data} />

        <div id="allowed-email-domains">
          <AllowedEmailDomainsPanel />
        </div>
      </div>
    </div>
  );
}
