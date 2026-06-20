"use client";

import type { HackathonFilterTab } from "@/features/events/types/hackathon.types";

const TABS: { value: HackathonFilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "ended", label: "Ended" },
];

const tabBase: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.24px",
  lineHeight: "12px",
  borderRadius: 9999,
  padding: "7px 17px",
  whiteSpace: "nowrap",
  transition: "background-color 150ms, color 150ms",
};

interface HackathonFiltersProps {
  active: HackathonFilterTab;
  onChange: (tab: HackathonFilterTab) => void;
}

export function HackathonFilters({ active, onChange }: HackathonFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-auto pb-2">
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            style={{
              ...tabBase,
              fontWeight: isActive ? 700 : 500,
              backgroundColor: isActive ? "#0e1528" : "transparent",
              color: isActive ? "#eef0f6" : "#0e1528",
              border: isActive ? "none" : "1px solid rgba(223,226,236,0.8)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
