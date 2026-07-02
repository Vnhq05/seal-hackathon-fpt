"use client";

import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import { useRegistrationAllowedDomains } from "@/features/events/hooks/use-allowed-email-domains";

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#8891a5",
  marginBottom: 4,
  display: "block",
};

const readOnlyStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "11px 16px",
  fontSize: 14,
  width: "100%",
  backgroundColor: "#eef0f6",
  color: "#4a5468",
};

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} disabled readOnly style={readOnlyStyle} />
    </div>
  );
}

export function PlatformConfigReferencePage() {
  const { data: config, isLoading, isError, error } = useSystemTeamConfig();
  const { data: allowedDomains = [], isLoading: domainsLoading } = useRegistrationAllowedDomains();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Platform Configuration
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Read-only view of platform settings managed by the administrator. Coordinators reference these values when creating events.
        </p>
      </div>

      {isError && (
        <div style={{
          backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#991b1b",
        }}>
          {error?.message || "Failed to load platform configuration."}
        </div>
      )}

      <div className="flex flex-col gap-6 p-8 max-w-[720px] border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        {isLoading ? (
          <p style={{ fontSize: 14, color: "#8891a5" }}>Loading configuration...</p>
        ) : config ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current Season" value={config.currentSeason} />
              <Field label="Current Year" value={config.currentYear} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Min Members / Team" value={config.minTeamMembers} />
              <Field label="Max Members / Team" value={config.maxTeamMembers} />
              <Field label="Min Teams (event to run)" value={config.minTeams ?? "—"} />
              <Field label="Max Teams (close registration)" value={config.maxTeams ?? "—"} />
              <Field label="Semester Min (eligibility)" value={config.semesterMin ?? "—"} />
              <Field label="Semester Max (eligibility)" value={config.semesterMax ?? "—"} />
            </div>

            {config.defaultRules && (
              <div>
                <label style={labelStyle}>Default Rules</label>
                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#eef0f6",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#4a5468",
                    whiteSpace: "pre-wrap",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {config.defaultRules}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Allowed Email Domains (External Students)</label>
              {domainsLoading ? (
                <p style={{ fontSize: 13, color: "#8891a5" }}>Loading domains...</p>
              ) : allowedDomains.length === 0 ? (
                <p style={{ fontSize: 13, color: "#8891a5" }}>No domains configured.</p>
              ) : (
                <div
                  style={{
                    padding: 12,
                    backgroundColor: "#eef0f6",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#4a5468",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {allowedDomains.map((domain) => (
                    <div key={domain.id ?? domain.domain} style={{ marginBottom: 6 }}>
                      <span style={{ fontFamily: "monospace" }}>@{domain.domain}</span>
                      {domain.universityLabel ? ` — ${domain.universityLabel}` : ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
