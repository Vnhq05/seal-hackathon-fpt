/* ============================================================================
 * app/app/submission/page.tsx — "/app/submission" chỉ chuyển hướng sang
 * "/app/team" (bài nộp được quản lý trong trang Team). Giống bản cũ.
 * ========================================================================== */
import { redirect } from "next/navigation";

export default function SubmissionRedirect() {
  redirect("/app/team");
}
