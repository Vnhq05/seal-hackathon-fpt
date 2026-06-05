"use client";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore } from "@/lib/judging-store";
import { Bell } from "lucide-react";

// Trang Notifications — mọi vai trò xem được (không cần useRequireRole).
export default function Notifications() {
  const { notifications } = useJudgingStore();
  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="rounded-xl border bg-card divide-y">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <div className={`h-8 w-8 rounded-md grid place-items-center ${n.type === "warning" ? "bg-warning/15 text-warning" : n.type === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}><Bell className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="font-medium text-sm">{n.title}</div>
              <div className="text-xs text-muted-foreground">{n.body}</div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(n.at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
