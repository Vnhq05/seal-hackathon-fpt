"use client";

import { AuthGuard } from "@/shared/components/auth-guard";
import { CoordinatorSidebar } from "@/shared/layouts/coordinator-sidebar";
import { CoordinatorTopNav } from "@/shared/layouts/coordinator-topnav";

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["EVENT_COORDINATOR"]}>
      <div className="relative flex min-h-screen bg-seal-bg">
        <CoordinatorSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <CoordinatorTopNav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
