import type { RoundResponse } from "@/lib/api";
import type { CompetitionFormat } from "@/lib/api/types";

export type SealSubmissionPhase =
  | "SLIDE_ONLY"
  | "FULL"
  | "SLIDE_CLOSED"
  | "DEMO_CLOSED"
  | "NOT_SEAL";

export function isSealPreliminaryRound(
  competitionFormat: CompetitionFormat | undefined,
  round: RoundResponse,
): boolean {
  return competitionFormat === "SEAL_RAG_2026" && round.roundType === "PRELIMINARY";
}

export function resolveSealPhase(
  round: RoundResponse,
  now = Date.now(),
): SealSubmissionPhase {
  if (!round.slideDeadline) return "NOT_SEAL";

  const slideDeadline = new Date(round.slideDeadline).getTime();
  const demoDeadline = new Date(round.submissionDeadline).getTime();

  if (now > demoDeadline) return "DEMO_CLOSED";
  if (now > slideDeadline) return "FULL";
  return "SLIDE_ONLY";
}

export function sealPhaseLabel(phase: SealSubmissionPhase): string {
  switch (phase) {
    case "SLIDE_ONLY":
      return "Milestone 1 — Submit slides (before 10:00)";
    case "FULL":
      return "Milestone 2 — Full submission (source + slide + demo, before 14:00)";
    case "SLIDE_CLOSED":
      return "Slide gate closed (after 10:00)";
    case "DEMO_CLOSED":
      return "Demo submission deadline passed (after 14:00)";
    default:
      return "";
  }
}

export function sealPhaseDescription(phase: SealSubmissionPhase): string {
  switch (phase) {
    case "SLIDE_ONLY":
      return "This phase only requires a slide link (Google Slides, online PowerPoint, etc.).";
    case "FULL":
      return "Add source code (GitHub/Jira/Notion) and demo video before the 14:00 deadline.";
    case "SLIDE_CLOSED":
      return "Slide-only submissions are no longer accepted. Submit a full entry if still within Milestone 2.";
    case "DEMO_CLOSED":
      return "The preliminary submission deadline has passed. No further submissions are allowed.";
    default:
      return "";
  }
}

export function canSubmitInSealPhase(phase: SealSubmissionPhase): boolean {
  return phase === "SLIDE_ONLY" || phase === "FULL";
}

export function msUntil(iso: string | null | undefined, now = Date.now()): number | null {
  if (!iso) return null;
  return new Date(iso).getTime() - now;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
