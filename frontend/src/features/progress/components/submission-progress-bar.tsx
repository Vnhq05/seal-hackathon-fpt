"use client";

export const PART_LABELS = ["Slide", "GitHub", "Other"] as const;
export const REQUIRED_SUBMISSION_PARTS = 3;

export interface SubmissionPartStatus {
  slide: boolean;
  source: boolean;
  other: boolean;
}

export function percentForSubmittedParts(submittedParts: number): number {
  if (submittedParts <= 0) return 0;
  if (submittedParts === 1) return 33.33;
  if (submittedParts === 2) return 66.66;
  return 100;
}

export function submissionPartsFromCounts(submittedParts: number): SubmissionPartStatus {
  return {
    slide: submittedParts >= 1,
    source: submittedParts >= 2,
    other: submittedParts >= 3,
  };
}

export function countSubmissionParts(status: SubmissionPartStatus): number {
  return [status.slide, status.source, status.other].filter(Boolean).length;
}

export function submissionPartsFromVersion(
  version: {
    slideUrl?: string | null;
    sourceCodeUrl?: string | null;
    githubUrl?: string | null;
    otherUrl?: string | null;
    demoUrl?: string | null;
    attachments?: unknown[] | null;
  } | null | undefined,
): SubmissionPartStatus {
  if (!version) {
    return { slide: false, source: false, other: false };
  }
  const source = version.sourceCodeUrl ?? version.githubUrl;
  const otherLink = version.otherUrl ?? version.demoUrl;
  return {
    slide: Boolean(version.slideUrl?.trim()),
    source: Boolean(source?.trim()),
    other: Boolean(otherLink?.trim()) || Boolean(version.attachments && version.attachments.length > 0),
  };
}

interface SubmissionProgressBarProps {
  percent: number;
  submittedParts?: number;
  requiredParts?: number;
  partStatus?: SubmissionPartStatus;
  showPartLabels?: boolean;
  size?: "sm" | "md";
}

export function SubmissionProgressBar({
  percent,
  submittedParts,
  requiredParts = REQUIRED_SUBMISSION_PARTS,
  partStatus,
  showPartLabels = false,
  size = "md",
}: SubmissionProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const isComplete = clampedPercent >= 100;
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  const displayPercent =
    Number.isInteger(clampedPercent) ? `${clampedPercent}` : clampedPercent.toFixed(2);
  const partsLabel =
    submittedParts != null ? `${submittedParts}/${requiredParts} parts` : `${displayPercent}%`;

  const labels = partStatus
    ? [
        { label: PART_LABELS[0], done: partStatus.slide },
        { label: PART_LABELS[1], done: partStatus.source },
        { label: PART_LABELS[2], done: partStatus.other },
      ]
    : null;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`font-mono font-bold ${size === "sm" ? "text-[10px]" : "text-xs"} text-amber-900/80`}>
          {displayPercent}%
        </span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} text-amber-800/60`}>{partsLabel}</span>
      </div>
      <div className={`w-full overflow-hidden rounded-full bg-amber-200/60 ${barHeight}`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-300 ${
            isComplete ? "bg-emerald-500" : "bg-amber-500"
          }`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showPartLabels && labels && (
        <div className="mt-2 flex flex-wrap gap-2">
          {labels.map((item) => (
            <span
              key={item.label}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                item.done ? "bg-emerald-100 text-emerald-800" : "bg-amber-100/80 text-amber-900/70"
              }`}
            >
              {item.done ? "✓ " : ""}
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
