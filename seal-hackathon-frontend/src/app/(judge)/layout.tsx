import { JudgeSidebar } from "@/shared/layouts/judge-sidebar";
import { JudgeTopNav } from "@/shared/layouts/judge-topnav";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <JudgeSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <JudgeTopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
