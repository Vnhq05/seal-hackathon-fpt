"use client";

import { useState } from "react";
import { useNotifications, type NotificationTab } from "@/features/notifications/hooks/use-notifications";
import { useMarkAllRead } from "@/features/notifications/hooks/use-mark-all-read";
import { NotificationFilters } from "@/features/notifications/components/notification-filters";
import { NotificationList } from "@/features/notifications/components/notification-list";

export function NotificationPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const { data, isLoading } = useNotifications(activeTab);
  const { markAllRead, isPending: isMarkingAll } = useMarkAllRead();

  const notifications = data?.content ?? [];
  const hasUnread = activeTab === "all" && notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-navy">
            Notifications
          </h1>

          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll || !hasUnread}
            className="text-xs font-medium text-seal-text-muted underline focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isMarkingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      </div>

      <NotificationFilters activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pb-8">
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          tab={activeTab}
        />
      </div>
    </div>
  );
}
