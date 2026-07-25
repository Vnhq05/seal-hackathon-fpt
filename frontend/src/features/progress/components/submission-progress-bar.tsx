"use client";

const PART_LABELS = ["Slide", "GitHub", "Demo", "PDF"] as const;

export interface SubmissionPartStatus {
  slide: boolean;
  source: boolean;
  demo: boolean;
  pdf: boolean;
}

export function submissionPartsFromCounts(submittedParts: number, requiredParts = 4): SubmissionPartStatus {
  return {
    slide: submittedParts >= 1,
    source: submittedParts >= 2,
    demo: submittedParts >= 3,
    pdf: submittedParts >= requiredParts,
  };
}

export function countSubmissionParts(status: SubmissionPartStatus): number {
  return [status.slide, status.source, status.demo, status.pdf].filter(Boolean).length;
}

export function submissionPartsFromVersion(
  version: {
    slideUrl?: string | null;
    sourceCodeUrl?: string | null;
    githubUrl?: string | null;
    demoUrl?: string | null;
    attachments?: unknown[] | null;
  } | null | undefined,
): SubmissionPartStatus {
  if (!version) {
    return { slide: false, source: false, demo: false, pdf: false };
  }
  const source = version.sourceCodeUrl ?? version.githubUrl;
  return {
    slide: Boolean(version.slideUrl?.trim()),
    source: Boolean(source?.trim()),
    demo: Boolean(version.demoUrl?.trim()),
    pdf: Boolean(version.attachments && version.attachments.length > 0),
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
  requiredParts = 4,
  partStatus,
  showPartLabels = false,
  size = "md",
}: SubmissionProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const isComplete = clampedPercent >= 100;
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  const filesLabel =
    submittedParts != null
      ? `${submittedParts}/${requiredParts} files`
      : `${clampedPercent}%`;

  const labels = partStatus
    ? [
        { label: PART_LABELS[0], done: partStatus.slide },
        { label: PART_LABELS[1], done: partStatus.source },
        { label: PART_LABELS[2], done: partStatus.demo },
        { label: PART_LABELS[3], done: partStatus.pdf },
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
