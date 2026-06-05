"use client";
/* ============================================================================
 * use-mobile.tsx — hook trả về true/false cho biết màn hình có đang ở kích thước
 * "điện thoại" hay không (rộng < 768px). Dùng bởi component sidebar để đổi cách
 * hiển thị trên mobile. Thuần React, không dính framework.
 * ========================================================================== */
import * as React from "react";

const MOBILE_BREAKPOINT = 768; // dưới mốc này (px) coi là mobile

export function useIsMobile() {
  // undefined = "chưa biết" (lần render đầu phía server chưa có window)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // matchMedia: API trình duyệt để lắng nghe thay đổi kích thước màn hình
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange); // mỗi lần qua/lại mốc 768px
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT); // đặt giá trị ban đầu
    return () => mql.removeEventListener("change", onChange); // dọn dẹp khi gỡ component
  }, []);

  return !!isMobile; // ép undefined → false để luôn trả về boolean
}
