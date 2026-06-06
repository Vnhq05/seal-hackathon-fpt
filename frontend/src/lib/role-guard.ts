"use client";
/* ============================================================================
 * role-guard.ts — chặn truy cập theo vai trò (Role).
 * ----------------------------------------------------------------------------
 * Bản TanStack cũ dùng hàm requireRole() đặt trong `beforeLoad` của route
 * (chạy TRƯỚC khi vào trang). Next.js App Router không có `beforeLoad`, nên ta
 * đổi thành 1 HOOK: trang nào cần giới hạn vai trò thì gọi useRequireRole([...])
 * ở đầu component. Nếu sai vai trò → tự động chuyển hướng đi nơi khác.
 *
 * Cách dùng trong một trang:
 *   "use client";
 *   export default function Page() {
 *     useRequireRole(["Coordinator", "Admin"]); // chỉ 2 vai trò này được vào
 *     ...
 *   }
 *
 * Lưu ý: "Lecturer" được tính như cả Mentor LẪN Judge (giống bản cũ).
 * ========================================================================== */
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth";

export function useRequireRole(allowed: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Gộp mảng allowed thành chuỗi để dùng làm "dependency" ổn định cho useEffect
  // (nếu truyền thẳng mảng, mỗi lần render là một mảng mới → effect chạy thừa).
  const allowedKey = allowed.join(",");

  React.useEffect(() => {
    if (loading) return; // chờ đọc xong session rồi mới quyết định
    if (!user) {
      router.replace("/login");
      return;
    }
    const list = allowedKey.split(",") as Role[];
    // Lecturer = Mentor ∪ Judge: nếu route cho phép Mentor hoặc Judge thì Lecturer cũng vào được.
    const lecturerOk =
      user.role === "Lecturer" && (list.includes("Mentor") || list.includes("Judge"));
    if (!list.includes(user.role) && !lecturerOk) {
      router.replace("/app/dashboard"); // sai vai trò → về dashboard
    }
  }, [user, loading, allowedKey, router]);
}
