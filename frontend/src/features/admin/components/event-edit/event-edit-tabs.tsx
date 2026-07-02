"use client";

export type EventEditTabId =
  | "basic"
  | "tracks"
  | "rounds"
  | "prizes"
  | "lecture"
  | "enrollments";

export const EVENT_EDIT_TABS: { id: EventEditTabId; label: string }[] = [
  { id: "basic", label: "Basic Information" },
  { id: "tracks", label: "Add Tracks" },
  { id: "rounds", label: "Add Rounds" },
  { id: "prizes", label: "Prizes and Honored Guest" },
  { id: "lecture", label: "Add Lecture" },
  { id: "enrollments", label: "Enrollments" },
];

const activeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#0e1528",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  textAlign: "center" as const,
};

const inactiveLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  textAlign: "center" as const,
};

export function EventEditTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: EventEditTabId;
  onTabChange: (tabId: EventEditTabId) => void;
}) {
  return (
    <div
      className="flex items-start gap-4 flex-wrap"
      style={{
        borderBottom: "1px solid rgba(223,226,236,0.8)",
        paddingBottom: 1,
      }}
    >
      {EVENT_EDIT_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
              paddingBottom: 10,
              cursor: "pointer",
              whiteSpace: "nowrap",
              ...(isActive ? activeLabelStyle : inactiveLabelStyle),
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function isValidEventEditTab(tab: string | null): tab is EventEditTabId {
  return EVENT_EDIT_TABS.some((t) => t.id === tab);
}
