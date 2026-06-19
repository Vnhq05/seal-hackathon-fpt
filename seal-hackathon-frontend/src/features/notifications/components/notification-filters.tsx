"use client";

import type { NotificationTab } from "@/features/notifications/types/notification.types";

interface NotificationFiltersProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
}

const TABS: { key: NotificationTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "events", label: "Events" },
  { key: "team", label: "Team" },
  { key: "results", label: "Results" },
  { key: "system", label: "System" },
];

export function NotificationFilters({
  activeTab,
  onTabChange,
}: NotificationFiltersProps) {
  return (
    <div
      className="flex gap-2 overflow-auto pb-[5px]"
      role="tablist"
      aria-label="Notification filters"
      style={{ borderBottom: "1px solid rgba(223,226,236,0.8)" }}
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;

        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className="flex-shrink-0 whitespace-nowrap px-4 py-2 text-xs font-medium tracking-wide transition-colors focus:outline-none"
            style={{
              borderRadius: "9999px",
              backgroundColor: isActive ? "#0e1528" : "#eef0f6",
              color: isActive ? "#dfe2ec" : "#0e1528",
              border: isActive ? "none" : "1px solid rgba(223,226,236,0.8)",
              letterSpacing: "0.24px",
              fontSize: "12px",
              lineHeight: "12px",
              padding: isActive ? "9px 16px" : "9px 17px",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
