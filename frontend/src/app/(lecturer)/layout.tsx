import { LecturerSidebar } from "@/shared/layouts/lecturer-sidebar";
import { LecturerTopNav } from "@/shared/layouts/lecturer-topnav";

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <LecturerSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <LecturerTopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
