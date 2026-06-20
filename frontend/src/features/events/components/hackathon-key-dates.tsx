import type { KeyDate } from "@/features/events/types/hackathon-detail.types";

interface HackathonKeyDatesProps {
  dates: KeyDate[];
}

function DateItem({ date }: { date: KeyDate }) {
  return (
    <div
      className="flex items-start justify-between"
      style={{
        borderLeft: `2px solid ${date.isCurrent ? "#000000" : "rgba(223,226,236,0.8)"}`,
        paddingLeft: 10,
      }}
    >
      <div className="flex flex-col">
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#0e1528",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          {date.label}
        </span>
        <span style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
          {date.sublabel}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#8891a5",
            lineHeight: "19.5px",
            textAlign: "right",
          }}
        >
          {date.dateText}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#8891a5",
            lineHeight: "19.5px",
            textAlign: "right",
          }}
        >
          {date.timeText}
        </span>
      </div>
    </div>
  );
}

export function HackathonKeyDates({ dates }: HackathonKeyDatesProps) {
  return (
    <div
      className="flex flex-col gap-4 rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{
          borderBottom: "1px solid rgba(198,198,205,0.5)",
          paddingBottom: 9,
        }}
      >
        <svg width="15" height="17" viewBox="0 0 15 17" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="13" height="13" rx="2" stroke="#0e1528" strokeWidth="1.5" />
          <path d="M4 1v4M11 1v4M1 8h13" stroke="#0e1528" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#0e1528",
            lineHeight: "25.2px",
          }}
        >
          Key Dates
        </h3>
      </div>
      <div className="flex flex-col gap-4">
        {dates.map((date) => (
          <DateItem key={date.id} date={date} />
        ))}
      </div>
    </div>
  );
}
