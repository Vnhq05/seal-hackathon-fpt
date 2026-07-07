import type { ProgressRiskReason } from "@/lib/api/progress.api";

export function progressReasonLabel(reason: ProgressRiskReason): string {
  switch (reason) {
    case "NOT_STARTED":
      return "Chưa bắt đầu nộp";
    case "SLIDE_ONLY_PAST_GATE":
      return "Chỉ có slide";
    case "SINGLE_VERSION_LAST_MINUTE":
      return "Nộp một lần sát giờ";
    case "STALLED":
      return "Không cập nhật lâu";
    case "MISSING_ATTACHMENT":
      return "Thiếu đính kèm";
    default:
      return reason;
  }
}
