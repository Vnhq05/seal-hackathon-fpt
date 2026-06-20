interface TabItem {
  id: string;
  label: string;
}

interface LeaderboardTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

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

export function LeaderboardTabs({
  tabs,
  activeTab,
  onTabChange,
}: LeaderboardTabsProps) {
  return (
    <div
      className="flex items-start gap-6"
      style={{
        borderBottom: "1px solid rgba(223,226,236,0.8)",
        paddingBottom: 1,
      }}
    >
      {tabs.map((tab) => {
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
