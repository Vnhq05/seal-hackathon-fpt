"use client";

import type { NotificationTab } from "@/features/notifications/hooks/use-notifications";

interface NotificationFiltersProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
}

const TABS: { key: NotificationTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

export function NotificationFilters({
  activeTab,
  onTabChange,
}: NotificationFiltersProps) {
  return (
    <div
      className="flex gap-2 overflow-auto border-b-2 border-navy/20 pb-[5px]"
      role="tablist"
      aria-label="Notification filters"
    >
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;

        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className={`flex-shrink-0 whitespace-nowrap border-2 px-4 py-2 text-xs font-medium tracking-wide transition-colors focus:outline-none ${
              isActive
                ? "border-navy bg-navy text-white shadow-[2px_2px_0_0_#0c1228]"
                : "border-navy/30 bg-white text-navy hover:bg-seal-surface-sunken"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
