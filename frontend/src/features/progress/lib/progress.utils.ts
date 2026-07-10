import type { ProgressRiskReason } from "@/lib/api/progress.api";
import { formatCountdown } from "@/features/submissions/utils/seal-submission.utils";

export function progressReasonLabel(reason: ProgressRiskReason): string {
  switch (reason) {
    case "NOT_STARTED":
      return "Not started";
    case "SLIDE_ONLY_PAST_GATE":
      return "Slide only";
    case "SINGLE_VERSION_LAST_MINUTE":
      return "Single last-minute submission";
    case "STALLED":
      return "No recent updates";
    case "MISSING_ATTACHMENT":
      return "Missing attachment";
    default:
      return reason;
  }
}

export function formatDeadlineSummary(hoursUntilDeadline: number): string {
  if (hoursUntilDeadline >= 0) {
    return `${hoursUntilDeadline} hour${hoursUntilDeadline === 1 ? "" : "s"} left until the submission deadline.`;
  }
  const overdue = Math.abs(hoursUntilDeadline);
  return `Submission deadline passed ${overdue} hour${overdue === 1 ? "" : "s"} ago.`;
}

export function formatRealtimeDeadline(ms: number | null): string {
  if (ms === null) return "Deadline unavailable";
  if (ms <= 0) return "Deadline passed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} left`;
  }
  if (hours >= 1) {
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return `${hours}h ${minutes}m left`;
  }
  return `${formatCountdown(ms)} left`;
}

export function formatRealtimeDeadlineDetail(ms: number | null): string {
  if (ms === null) return "deadline unavailable";
  if (ms <= 0) return "deadline passed";
  return `${formatRealtimeDeadline(ms)} until deadline`;
}

/** Progress alerts only apply while the submission window is still open. */
export function isSubmissionDeadlineOpen(
  submissionDeadline?: string | null,
  hoursUntilDeadline?: number | null,
): boolean {
  if (typeof hoursUntilDeadline === "number" && hoursUntilDeadline < 0) {
    return false;
  }
  if (!submissionDeadline) return true;
  const ms = new Date(submissionDeadline).getTime();
  if (Number.isNaN(ms)) return true;
  return ms > Date.now();
}
