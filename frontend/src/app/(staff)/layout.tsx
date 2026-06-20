import { StaffSidebar } from "@/shared/layouts/staff-sidebar";
import { StaffTopNav } from "@/shared/layouts/staff-topnav";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <StaffSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <StaffTopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
