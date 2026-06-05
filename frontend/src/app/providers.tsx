"use client";
/* ============================================================================
 * providers.tsx — gom tất cả "Provider" (Context) toàn cục vào một chỗ.
 * ----------------------------------------------------------------------------
 * Vì sao tách riêng file này?
 *   layout.tsx (file kế bên) là Server Component — KHÔNG được chứa Context/hook
 *   của React. Mà AuthProvider, React Query... đều cần chạy ở phía client.
 *   → Giải pháp chuẩn của Next.js: tạo 1 component "use client" riêng (file này)
 *     rồi cho layout bọc children vào trong nó.
 *
 * Ở bản TanStack cũ, những thứ này nằm trong __root.tsx (RootComponent).
 * ========================================================================== */
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Tạo QueryClient 1 lần duy nhất (dùng useState để không tạo lại mỗi lần render).
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        {/* Toaster = popup thông báo nhỏ góc màn hình (thư viện sonner) */}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
