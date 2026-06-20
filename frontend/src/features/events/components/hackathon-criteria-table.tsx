import type { JudgingCriterion } from "@/features/events/types/hackathon-detail.types";

interface HackathonCriteriaTableProps {
  criteria: JudgingCriterion[];
}

const headerStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  padding: 8,
};

function CriteriaRow({ criterion }: { criterion: JudgingCriterion }) {
  return (
    <div
      className="flex items-center"
      style={{ borderTop: "1px solid rgba(198,198,205,0.5)" }}
    >
      <div className="flex-shrink-0 px-2 py-5" style={{ width: 216 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#0e1528", lineHeight: "21px" }}>
          {criterion.name}
        </span>
      </div>
      <div className="flex-shrink-0 px-2 py-2" style={{ width: 270 }}>
        <span style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
          {criterion.description}
        </span>
      </div>
      <div className="flex flex-1 items-center gap-2 pl-2 pr-2">
        <div
          className="relative h-2 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(223,226,236,0.8)" }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              backgroundColor: "#38bdf8",
              width: `${criterion.weight}%`,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#0e1528",
            lineHeight: "19.5px",
          }}
        >
          {criterion.weight}%
        </span>
      </div>
    </div>
  );
}

export function HackathonCriteriaTable({
  criteria,
}: HackathonCriteriaTableProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#0e1528",
          letterSpacing: "-0.24px",
          lineHeight: "31.2px",
        }}
      >
        Judging Criteria
      </h2>
      <div
        className="overflow-hidden rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)" }}
      >
        <div
          className="flex"
          style={{
            backgroundColor: "#eef0f6",
            borderBottom: "1px solid rgba(223,226,236,0.8)",
          }}
        >
          <div style={{ ...headerStyle, width: 216 }}>Criteria</div>
          <div style={{ ...headerStyle, width: 270 }}>Description</div>
          <div style={{ ...headerStyle, flex: 1 }}>Weight</div>
        </div>
        {criteria.map((c) => (
          <CriteriaRow key={c.id} criterion={c} />
        ))}
      </div>
    </section>
  );
}
