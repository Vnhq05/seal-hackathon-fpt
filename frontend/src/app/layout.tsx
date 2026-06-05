/* ============================================================================
 * layout.tsx — LAYOUT GỐC của cả app (Next.js App Router).
 * ----------------------------------------------------------------------------
 * File này thay cho __root.tsx của bản TanStack cũ. Mọi trang đều được bọc
 * bên trong layout này. Đây là Server Component (không có "use client") nên
 * nó được phép export `metadata` (tiêu đề tab, mô tả SEO...).
 *
 * Quy tắc Next.js: layout gốc BẮT BUỘC phải render thẻ <html> và <body>.
 * ========================================================================== */
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// metadata = thẻ <title>, <meta> ... Next.js tự chèn vào <head> giúp.
export const metadata: Metadata = {
  title: "SEAL Hackathon Management System",
  description:
    "Fair, auditable hackathon operating system for FPT University — 51 business rules, 5 roles, 6 phases.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // className="dark" để bật theme tối (giống bản cũ)
    <html lang="en" className="dark">
      <body>
        {/* Providers bọc toàn bộ app để mọi trang dùng được Auth + React Query */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
