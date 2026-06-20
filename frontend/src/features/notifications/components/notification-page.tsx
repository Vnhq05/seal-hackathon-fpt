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
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#0e1528",
              lineHeight: "38.4px",
              letterSpacing: "-0.64px",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Notifications
          </h1>

          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll || !hasUnread}
            className="focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
              lineHeight: "12px",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
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
