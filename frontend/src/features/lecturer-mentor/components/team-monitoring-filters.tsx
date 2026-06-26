import type { MentorTeamFilter } from "@/features/lecturer-mentor/types/mentor.types";

const FILTERS: { value: MentorTeamFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "not_submitted", label: "Not submitted" },
  { value: "eliminated", label: "Eliminated" },
];

const activePillStyle: React.CSSProperties = {
  backgroundColor: "#38bdf8",
  color: "#ffffff",
  border: "none",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
};

const inactivePillStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#8891a5",
  border: "1px solid rgba(223,226,236,0.8)",
};

const pillBase: React.CSSProperties = {
  borderRadius: 9999,
  padding: "7px 17px",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.24px",
  lineHeight: "12px",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

interface TeamMonitoringFiltersProps {
  activeFilter: MentorTeamFilter;
  onFilterChange: (filter: MentorTeamFilter) => void;
}

export function TeamMonitoringFilters({
  activeFilter,
  onFilterChange,
}: TeamMonitoringFiltersProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(226,232,240,0.8)",
        borderRadius: 8,
        padding: 17,
      }}
    >
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFilterChange(f.value)}
            style={{
              ...pillBase,
              ...(activeFilter === f.value ? activePillStyle : inactivePillStyle),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
          Sort by:
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px", lineHeight: "12px" }}>
          Rank (Highest)
        </span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M5 7l4 4 4-4" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
