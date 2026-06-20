import type React from "react";

export const pipelineMetaStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--color-seal-text-secondary)",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

export const STATUS_BADGE_STYLE: Record<string, React.CSSProperties> = {
  submitted: {
    backgroundColor: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.2)",
    color: "var(--color-seal-success)",
  },
  not_submitted: {
    backgroundColor: "var(--color-seal-surface-elevated)",
    border: "1px solid var(--color-seal-border)",
    color: "var(--color-seal-text-secondary)",
  },
  not_open: {
    backgroundColor: "var(--color-seal-surface-elevated)",
    border: "1px solid var(--color-seal-border)",
    color: "var(--color-seal-text-muted)",
  },
};

export const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  not_submitted: "Not submitted",
  not_open: "Round not open",
};

export function formatSubmittedDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `Submitted ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`;
}

export function formatLastUpdated(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
