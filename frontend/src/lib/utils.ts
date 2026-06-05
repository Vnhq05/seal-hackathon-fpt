/* ============================================================================
 * utils.ts — các hàm tiện ích dùng chung khắp app (KHÔNG dính framework nào).
 * Đây là JavaScript/TypeScript thuần nên Next.js hay TanStack đều dùng y hệt.
 * ========================================================================== */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn = "class names". Gộp nhiều chuỗi class Tailwind lại thành 1 chuỗi.
 *  - clsx: bỏ qua giá trị falsy (false/undefined) → cho phép viết class có điều kiện.
 *  - twMerge: nếu 2 class Tailwind xung đột (vd "p-2" và "p-4") thì giữ class sau cùng.
 * Ví dụ: cn("p-2", isActive && "bg-primary", "p-4")  →  "bg-primary p-4"
 * Hàm này được gần như MỌI component UI dùng tới.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trích ID video YouTube từ 1 đường link bất kỳ (youtu.be/... hoặc youtube.com/watch?v=...).
 * Dùng ở trang Evaluate để nhúng video demo của đội. Không khớp → trả về null.
 */
export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/**
 * Trả về tên class CSS cho "badge" trạng thái cuộc thi (Draft/Open/Active...).
 * Các class badge-status-* được định nghĩa trong globals.css.
 */
export function statusBadgeClass(status: string): string {
  const base = "border-transparent shadow-none";
  switch (status) {
    case "Draft":      return `${base} badge-status-draft`;
    case "Open":       return `${base} badge-status-open`;
    case "Active":     return `${base} badge-status-active`;
    case "Scoring":    return `${base} badge-status-scoring`;
    case "Closed":     return `${base} badge-status-closed`;
    case "Cancelled":  return `${base} badge-status-cancelled`;
    default:           return `${base} badge-status-draft`;
  }
}

/**
 * Đoán "nhóm chủ đề" (track) của đội từ tên track rồi trả về class màu tương ứng.
 * Vd track "AI/Healthcare" có chữ "ai" → badge màu AI. Mặc định → badge "other".
 */
export function trackBadgeClass(track?: string): string {
  const t = (track || "").toLowerCase();
  if (t.includes("ai") || t.includes("machine") || t.includes("ml")) return "badge-track badge-track-ai";
  if (t.includes("health") || t.includes("med") || t.includes("bio")) return "badge-track badge-track-healthcare";
  if (t.includes("sustain") || t.includes("green") || t.includes("climate") || t.includes("environment")) return "badge-track badge-track-sustainability";
  if (t.includes("fin") || t.includes("web3") || t.includes("crypto") || t.includes("blockchain")) return "badge-track badge-track-fintech";
  if (t.includes("edu") || t.includes("learn") || t.includes("edtech")) return "badge-track badge-track-education";
  return "badge-track badge-track-other";
}

/**
 * Class màu cho badge trạng thái CHẤM ĐIỂM (PENDING/APPROVED/LOCKED...).
 */
export function scoringStatusClass(status: string): string {
  const base = "border-transparent shadow-none";
  switch (status) {
    case "PENDING":         return `${base} badge-scoring-pending`;
    case "IN_PROGRESS":     return `${base} badge-scoring-in-progress`;
    case "PENDING_REVIEW":  return `${base} badge-scoring-in-progress`;
    case "APPROVED":        return `${base} badge-scoring-approved`;
    case "REJECTED":        return `${base} badge-scoring-rejected`;
    case "LOCKED":          return `${base} badge-scoring-locked`;
    default:                return `${base} badge-scoring-pending`;
  }
}
