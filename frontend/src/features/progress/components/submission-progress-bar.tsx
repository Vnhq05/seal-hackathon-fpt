"use client";

/** Mirrors SubmissionProgressCalculator on the backend: Slide, GitHub/source, Other. */
export const REQUIRED_SUBMISSION_PARTS = 3;

const PART_LABELS = ["Slide", "GitHub", "Other"] as const;

export interface SubmissionPartStatus {
  slide: boolean;
  source: boolean;
  other: boolean;
}

/** Per-input state of the submit form; Other URL and Other file both feed the single "Other" part. */
export interface SubmissionFieldStatus extends SubmissionPartStatus {
  otherLink: boolean;
  otherFile: boolean;
}

export function percentForParts(submittedParts: number): number {
  switch (submittedParts) {
    case 0:
      return 0;
    case 1:
      return 33.33;
    case 2:
      return 66.66;
    default:
      return 100;
  }
}

export function submissionPartsFromCounts(
  submittedParts: number,
  requiredParts = REQUIRED_SUBMISSION_PARTS,
): SubmissionPartStatus {
  return {
    slide: submittedParts >= 1,
    source: submittedParts >= 2,
    other: submittedParts >= requiredParts,
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
): SubmissionFieldStatus {
  if (!version) {
    return { slide: false, source: false, other: false, otherLink: false, otherFile: false };
  }
  const source = version.sourceCodeUrl ?? version.githubUrl;
  const otherLink = Boolean((version.otherUrl ?? version.demoUrl)?.trim());
  const otherFile = Boolean(version.attachments && version.attachments.length > 0);
  return {
    slide: Boolean(version.slideUrl?.trim()),
    source: Boolean(source?.trim()),
    otherLink,
    otherFile,
    other: otherLink || otherFile,
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
  const filesLabel =
    submittedParts != null
      ? `${submittedParts}/${requiredParts} parts`
      : `${clampedPercent}%`;

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
          {clampedPercent}%
        </span>
        <span className={`${size === "sm" ? "text-[10px]" : "text-xs"} text-amber-800/60`}>{filesLabel}</span>
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
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {labels.map(({ label, done }) => (
            <span
              key={label}
              className={`text-[10px] ${done ? "font-semibold text-emerald-700" : "text-amber-800/50"}`}
            >
              {done ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
