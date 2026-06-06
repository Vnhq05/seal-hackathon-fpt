/* ============================================================================
 * app/app/page.tsx — khi vào "/app" (không kèm trang con) thì tự nhảy sang
 * "/app/dashboard". Tương đương routes/app.index.tsx (redirect) của bản cũ.
 * redirect() của next/navigation chạy được ở Server Component nên không cần "use client".
 * ========================================================================== */
import { redirect } from "next/navigation";

export default function AppIndex() {
  redirect("/app/dashboard");
}
