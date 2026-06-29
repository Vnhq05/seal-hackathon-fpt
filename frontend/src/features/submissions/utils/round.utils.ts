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
    return `Round chưa bắt đầu. Thời gian mở: ${formatDt(round.startDate)} — ${formatDt(round.endDate)}`;
  }
  if (now > submissionEnd) {
    if (round.submissionDeadline && submissionEnd !== end) {
      return `Đã qua deadline nộp bài (${formatDt(round.submissionDeadline)})`;
    }
    return `Round đã kết thúc (${formatDt(round.startDate)} — ${formatDt(round.endDate)})`;
  }
  return "";
}

function formatDt(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export const MAX_PDF_BYTES = 5 * 1024 * 1024;

export function validatePdfFile(file: File): string | null {
  if (file.type !== "application/pdf") return "File phải là PDF";
  if (file.size > MAX_PDF_BYTES) return "PDF phải nhỏ hơn 5MB";
  return null;
}
