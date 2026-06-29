"use client";

import { useState } from "react";
import type { AllowedEmailDomainResponse } from "@/lib/api/event.api";
import { normalizeRuleDomain } from "@/lib/email-domain";
import {
  useAddAllowedEmailDomain,
  useAllowedEmailDomains,
  useRemoveAllowedEmailDomain,
} from "@/features/events/hooks/use-allowed-email-domains";

const headerCell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  padding: "12px 16px",
  textAlign: "left",
};

const bodyCell: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  lineHeight: "20px",
  padding: "14px 16px",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

interface AllowedEmailDomainsPanelProps {
  eventId: string;
  className?: string;
}

function DomainRow({
  domain,
  onRemove,
  isRemoving,
}: {
  domain: AllowedEmailDomainResponse;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontFamily: "monospace" }}>@{domain.domain}</td>
      <td style={bodyCell}>{domain.universityLabel ?? "—"}</td>
      <td style={bodyCell}>
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#991b1b",
            background: "none",
            border: "none",
            cursor: isRemoving ? "not-allowed" : "pointer",
            opacity: isRemoving ? 0.6 : 1,
          }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export function AllowedEmailDomainsPanel({ eventId, className }: AllowedEmailDomainsPanelProps) {
  const { data: domains = [], isLoading, error } = useAllowedEmailDomains(eventId);
  const { mutate: addDomain, isPending: isAdding, error: addError } = useAddAllowedEmailDomain(eventId);
  const { mutate: removeDomain, isPending: isRemoving, variables: removingId } =
    useRemoveAllowedEmailDomain(eventId);

  const [domain, setDomain] = useState("");
  const [universityLabel, setUniversityLabel] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleAdd = () => {
    const normalized = normalizeRuleDomain(domain);
    if (!normalized) {
      setFormError("Domain is required.");
      return;
    }
    setFormError(null);
    addDomain(
      {
        domain: normalized,
        universityLabel: universityLabel.trim() || undefined,
      },
      {
        onSuccess: () => {
          setDomain("");
          setUniversityLabel("");
        },
        onError: (err) => {
          setFormError(err instanceof Error ? err.message : "Failed to add domain.");
        },
      },
    );
  };

  const errorMessage =
    formError ??
    (addError instanceof Error ? addError.message : null) ??
    (error instanceof Error ? error.message : null);

  return (
    <div className={className}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>
          Allowed Email Domains (External Students)
        </h2>
        <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4, lineHeight: 1.5 }}>
          External students must register with a university email from this list. Domains are stored
          without <code>@</code>; subdomains are accepted (e.g.{" "}
          <code>student@student.hcmus.edu.vn</code> matches <code>hcmus.edu.vn</code>).
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-seal-text">Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="hcmut.edu.vn"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-seal-text">University label</label>
            <input
              type="text"
              value={universityLabel}
              onChange={(e) => setUniversityLabel(e.target.value)}
              placeholder="Ho Chi Minh City University of Technology"
              style={inputStyle}
            />
          </div>
        </div>
        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
        <div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding}
            className="border-2 border-navy bg-seal-yellow px-5 py-2 text-sm font-mono font-bold text-navy cursor-pointer disabled:opacity-60"
          >
            {isAdding ? "Adding..." : "Add domain"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-royal border-t-transparent" />
        </div>
      ) : domains.length === 0 ? (
        <p className="text-sm text-seal-text-muted">
          No allowed domains configured. External registration will reject all emails for SEAL events
          until domains are added.
        </p>
      ) : (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Domain</th>
                <th style={headerCell}>University</th>
                <th style={headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((row) => (
                <DomainRow
                  key={row.id ?? row.domain}
                  domain={row}
                  isRemoving={isRemoving && removingId === row.id}
                  onRemove={() => removeDomain(row.id!)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
