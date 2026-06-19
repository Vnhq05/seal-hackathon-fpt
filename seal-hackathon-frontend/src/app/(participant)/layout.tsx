import { DashboardSidebar } from "@/shared/layouts/dashboard-sidebar";
import { DashboardTopNav } from "@/shared/layouts/dashboard-topnav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <DashboardTopNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
