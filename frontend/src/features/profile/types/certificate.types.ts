import type { UserAchievement } from "@/lib/api/admin-user.api";

/**
 * Props for the reusable certificate template.
 * Only these fields need to change per recipient / event.
 */
export interface CertificateTemplateData {
  /** Event display name — e.g. "SEAL HACKATHON 2026" */
  eventName: string;
  /** Team name shown under "Presented to" */
  teamName: string;
  /** Prize label from edit-event prizes (or rank fallback) — e.g. "FIRST PRIZE" */
  prizeLabel: string;
  /** Project name + content line under the prize */
  projectContent: string;
  /** Stable printable ID — e.g. "SEAL-2026-WIN-001" */
  certificateId: string;
  /** ISO date string for issued date (optional footer) */
  achievedAt: string;
  /** Optional recipient full name (member of the awarded team) */
  recipientName?: string;
  universityLogoUrl?: string;
  hackathonLogoUrl?: string;
  type: UserAchievement["type"];
}
