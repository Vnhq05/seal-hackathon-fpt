"use client";
/* ============================================================================
 * app/app/layout.tsx — layout dùng chung cho TẤT CẢ trang trong khu /app/...
 * ----------------------------------------------------------------------------
 * Nhiệm vụ:
 *   1) Chặn người chưa đăng nhập (nếu chưa login → đá về /login).
 *   2) Bọc nội dung trong <AppShell> (sidebar + header).
 *
 * Bản TanStack cũ làm việc này trong routes/app.tsx bằng `beforeLoad` +
 * `<Outlet/>`. Ở Next.js: thư mục app/app/ có file layout.tsx này, và
 * `children` chính là trang con đang mở (thay cho <Outlet/>).
 *
 * Phải có "use client" vì ta đọc localStorage (useAuth) — thứ chỉ có ở trình duyệt.
 * ========================================================================== */
import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Khi đã load xong mà không có user → chưa đăng nhập → chuyển sang /login
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Trong lúc đang đọc session hoặc chưa có user: hiện màn hình chờ
  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
