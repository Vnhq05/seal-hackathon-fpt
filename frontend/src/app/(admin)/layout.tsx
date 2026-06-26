"use client";

import { AuthGuard } from "@/shared/components/auth-guard";
import { AdminSidebar } from "@/shared/layouts/admin-sidebar";
import { AdminTopNav } from "@/shared/layouts/admin-topnav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <div className="relative flex min-h-screen bg-seal-bg">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <AdminTopNav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
