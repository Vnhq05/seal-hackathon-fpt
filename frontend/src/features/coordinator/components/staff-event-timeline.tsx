"use client";

const PHASES = ["Registration", "Hacking Starts", "Submissions Due", "Judging", "Closing"] as const;

type Phase = "registration" | "hacking" | "submissions" | "judging" | "closing";
const PHASE_INDEX: Record<Phase, number> = {
  registration: 0,
  hacking: 1,
  submissions: 2,
  judging: 3,
  closing: 4,
};

export function StaffEventTimeline({ phase }: { phase: Phase }) {
  const activeIdx = PHASE_INDEX[phase];

  return (
    <div
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: "24px 32px", marginBottom: 24 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528", marginBottom: 20 }}>
        Event Timeline
      </h3>

      <div className="relative flex items-center justify-between" style={{ padding: "0 8px" }}>
        <div
          className="absolute"
          style={{ top: 8, left: 20, right: 20, height: 3, backgroundColor: "rgba(223,226,236,0.8)", zIndex: 0 }}
        />
        <div
          className="absolute"
          style={{
            top: 8,
            left: 20,
            width: `${Math.min((activeIdx / (PHASES.length - 1)) * 100, 100)}%`,
            height: 3,
            backgroundColor: "#38bdf8",
            zIndex: 1,
            maxWidth: "calc(100% - 40px)",
          }}
        />

        {PHASES.map((label, i) => {
          const isPast = i < activeIdx;
          const isCurrent = i === activeIdx;
          const isFuture = i > activeIdx;

          return (
            <div key={label} className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: isPast || isCurrent ? "#38bdf8" : "#ffffff",
                  border: isFuture ? "2px solid rgba(223,226,236,0.8)" : "2px solid #38bdf8",
                }}
              >
                {isCurrent && (
                  <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#ffffff" }} />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? "#0e1528" : "#8891a5",
                  marginTop: 8,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
