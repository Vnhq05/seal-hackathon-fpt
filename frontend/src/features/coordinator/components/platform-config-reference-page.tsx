"use client";

import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import { SealCard } from "@/shared/ui/seal-card";

const labelClass = "mb-1.5 block text-sm font-semibold text-seal-text-muted";
const readOnlyClass =
  "w-full rounded-lg border border-seal-border/80 bg-seal-surface-sunken px-4 py-2.5 text-sm text-seal-text-secondary";
const sectionBoxClass =
  "max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg border border-seal-border/60 bg-seal-surface-sunken px-3.5 py-3 text-[13px] leading-relaxed text-seal-text-secondary";

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input value={value} disabled readOnly className={readOnlyClass} />
    </div>
  );
}

export function PlatformConfigReferencePage() {
  const { data: config, isLoading, isError, error } = useSystemTeamConfig();

  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-2 sm:px-4">
      <header className="mb-8 border-b-2 border-navy/10 pb-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-navy sm:text-[32px]">
          Platform Configuration
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-seal-text-muted">
          Read-only view of platform settings managed by the administrator. Coordinators
          reference these values when creating events.
        </p>
      </header>

      {isError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error?.message || "Failed to load platform configuration."}
        </div>
      )}

      <SealCard className="space-y-6 p-5 sm:p-7">
        {isLoading ? (
          <p className="text-sm text-seal-text-muted">Loading configuration...</p>
        ) : config ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current Season" value={config.currentSeason} />
              <Field label="Current Year" value={config.currentYear} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Min Members / Team" value={config.minTeamMembers} />
              <Field label="Max Members / Team" value={config.maxTeamMembers} />
              <Field label="Min Teams (event to run)" value={config.minTeams ?? "—"} />
              <Field label="Max Teams (close registration)" value={config.maxTeams ?? "—"} />
              <Field label="Semester Min (eligibility)" value={config.semesterMin ?? "—"} />
              <Field label="Semester Max (eligibility)" value={config.semesterMax ?? "—"} />
            </div>

            {config.defaultRules && (
              <div>
                <label className={labelClass}>Default Rules</label>
                <div className={sectionBoxClass}>{config.defaultRules}</div>
              </div>
            )}

            <div>
              <label className={labelClass}>External Student Email Rule</label>
              <div className={sectionBoxClass}>
                University emails must end with <span className="font-mono">.edu.vn</span>{" "}
                (e.g. student@hcmut.edu.vn).
              </div>
            </div>
          </>
        ) : null}
      </SealCard>
    </div>
  );
}
