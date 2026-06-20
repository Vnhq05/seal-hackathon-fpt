import { MentorSidebar } from "@/shared/layouts/mentor-sidebar";
import { MentorTopNav } from "@/shared/layouts/mentor-topnav";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <MentorSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <MentorTopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
