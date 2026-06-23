"use client";

const STEPS = [
  "Name & Season",
  "Basic Info",
  "Timeline & Rounds",
  "Rules & Teams",
  "Prizes & Guests",
  "Scoring",
  "Preview",
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1" style={{ marginBottom: 32 }}>
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={idx} className="flex items-center gap-1" style={{ flex: 1 }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  backgroundColor: isDone ? "#10b981" : isActive ? "#38bdf8" : "#eef0f6",
                  color: isDone || isActive ? "#ffffff" : "#8891a5",
                  flexShrink: 0,
                }}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                color: isActive ? "#0e1528" : "#8891a5",
              }}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginLeft: 4, marginRight: 4,
                backgroundColor: isDone ? "#10b981" : "#eef0f6",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
