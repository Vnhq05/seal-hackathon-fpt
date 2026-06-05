"use client";
/* ============================================================================
 * view-mode.ts — xử lý việc tài khoản "Lecturer" (Giảng viên) chuyển qua lại
 * giữa 2 chế độ xem: "Mentor" và "Judge".
 * ----------------------------------------------------------------------------
 * Bối cảnh: Lecturer vừa làm Mentor vừa làm Judge. Thay vì tạo 2 tài khoản,
 * ta cho họ 1 nút gạt để xem giao diện theo vai trò đang chọn. Lựa chọn này
 * được lưu vào localStorage để F5 vẫn nhớ.
 *
 * "use client" vì có đọc/ghi localStorage và dùng hook React.
 * ========================================================================== */
import * as React from "react";
import type { Role } from "@/lib/auth";

export type ViewMode = "Mentor" | "Judge";
const K = "seal_view_mode"; // khóa lưu trong localStorage

/** Đọc chế độ đang chọn từ localStorage. Mặc định "Mentor". */
export function getViewMode(): ViewMode {
  if (typeof window === "undefined") return "Mentor"; // đang chạy ở server → trả mặc định
  const v = localStorage.getItem(K);
  return v === "Judge" ? "Judge" : "Mentor";
}

/** Lưu chế độ mới + phát 1 "sự kiện" để mọi component đang nghe tự cập nhật lại. */
export function setViewMode(m: ViewMode) {
  localStorage.setItem(K, m);
  // CustomEvent: cách store tự viết để báo "dữ liệu đã đổi" cho các hook bên dưới.
  window.dispatchEvent(new CustomEvent("view-mode-changed"));
}

/**
 * Hook để component "theo dõi" chế độ hiện tại theo thời gian thực.
 * Trả về [chế độ, hàm đổi chế độ] — giống cách dùng của useState.
 * Khi ai đó gọi setViewMode ở chỗ khác, sự kiện "view-mode-changed" bắn ra,
 * hook này nghe được và setM lại → component render lại với giá trị mới.
 */
export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [m, setM] = React.useState<ViewMode>("Mentor");
  React.useEffect(() => {
    setM(getViewMode()); // đọc giá trị thật sau khi component đã gắn vào trình duyệt
    const h = () => setM(getViewMode());
    window.addEventListener("view-mode-changed", h); // đổi từ tab này
    window.addEventListener("storage", h);            // đổi từ tab khác
    return () => {
      window.removeEventListener("view-mode-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return [m, setViewMode];
}

/**
 * Trả về "vai trò thực tế" để quyết định hiển thị gì.
 *  - Nếu là Lecturer → trả về chế độ đang chọn (Mentor hoặc Judge).
 *  - Vai trò khác → giữ nguyên.
 * Dùng ở app-shell (lọc menu) và dashboard (hiện widget đúng vai trò).
 */
export function useEffectiveRole(role: Role | undefined): Role | undefined {
  const [mode] = useViewMode();
  if (role === "Lecturer") return mode;
  return role;
}
