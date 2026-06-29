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
      return "Milestone 1 — Nộp slide (trước 10:00)";
    case "FULL":
      return "Milestone 2 — Nộp đầy đủ (source + slide + demo, trước 14:00)";
    case "SLIDE_CLOSED":
      return "Cổng slide đã đóng (sau 10:00)";
    case "DEMO_CLOSED":
      return "Hết hạn nộp demo (sau 14:00)";
    default:
      return "";
  }
}

export function sealPhaseDescription(phase: SealSubmissionPhase): string {
  switch (phase) {
    case "SLIDE_ONLY":
      return "Giai đoạn này chỉ cần link slide (Google Slides, PowerPoint online, v.v.).";
    case "FULL":
      return "Bổ sung source code (GitHub/Jira/Notion) và demo video trước deadline 14:00.";
    case "SLIDE_CLOSED":
      return "Không thể nộp chỉ slide nữa. Cần nộp bài đầy đủ nếu còn trong Milestone 2.";
    case "DEMO_CLOSED":
      return "Đã qua deadline nộp bài vòng bảng. Không thể submit thêm.";
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
