import type { RoundResponse } from "@/lib/api";

export function isRoundOpen(round: RoundResponse): boolean {
  const now = Date.now();
  const start = new Date(round.startDate).getTime();
  const end = new Date(round.endDate).getTime();
  if (now < start) return false;

  if (round.submissionDeadline) {
    const submissionEnd = new Date(round.submissionDeadline).getTime();
    return now <= submissionEnd;
  }

  return now <= end;
}

export function findCurrentRound(rounds: RoundResponse[]): RoundResponse | null {
  const open = rounds.find(isRoundOpen);
  if (open) return open;
  return null;
}

export function roundLockMessage(round: RoundResponse): string {
  const now = Date.now();
  const start = new Date(round.startDate).getTime();
  const end = new Date(round.endDate).getTime();
  const submissionEnd = round.submissionDeadline
    ? new Date(round.submissionDeadline).getTime()
    : end;

  if (now < start) {
    return `Round has not started yet. Opens: ${formatDt(round.startDate)} — ${formatDt(round.endDate)}`;
  }
  if (now > submissionEnd) {
    if (round.submissionDeadline && submissionEnd !== end) {
      return `Submission deadline has passed (${formatDt(round.submissionDeadline)})`;
    }
    return `Round has ended (${formatDt(round.startDate)} — ${formatDt(round.endDate)})`;
  }
  return "";
}

function formatDt(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_SUBMISSION_FILE_BYTES = 25 * 1024 * 1024;

export function validatePdfFile(file: File): string | null {
  const isPdfName = file.name.toLowerCase().endsWith(".pdf");
  // Windows often leaves File.type empty for locally created PDFs.
  const isPdfMime = !file.type || file.type === "application/pdf";
  if (!isPdfName || !isPdfMime) {
    return "File must be a PDF";
  }
  if (file.size > MAX_PDF_BYTES) {
    return `PDF must be smaller than 5MB (selected: ${(file.size / 1024).toFixed(1)} KB)`;
  }
  return null;
}

/** Any file type allowed under Other; size capped at 25 MB. */
export function validateAnySubmissionFile(file: File): string | null {
  if (file.size > MAX_SUBMISSION_FILE_BYTES) {
    return `File must be smaller than 25MB (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
  }
  return null;
}
