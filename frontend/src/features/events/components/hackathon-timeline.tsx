import type { TimelineStep } from "@/features/events/types/hackathon-detail.types";

interface HackathonTimelineProps {
  steps: TimelineStep[];
}

function StepDot({ status }: { status: TimelineStep["status"] }) {
  if (status === "completed") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: 16,
          height: 16,
          left: -25,
          top: 0,
          backgroundColor: "#38bdf8",
          border: "2px solid white",
        }}
      >
        <svg width="7" height="5" viewBox="0 0 7 5" fill="none" aria-hidden="true">
          <path d="M1 2.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (status === "current") {
    return (
      <div
        className="absolute rounded-full"
        style={{
          width: 20,
          height: 20,
          left: -27,
          top: -2,
          backgroundColor: "#38bdf8",
          border: "2px solid white",
          boxShadow: "0px 0px 0px 4px rgba(0,0,0,0.2)",
        }}
      />
    );
  }

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: 16,
        height: 16,
        left: -25,
        top: 0,
        backgroundColor: "rgba(223,226,236,0.8)",
        border: "2px solid white",
      }}
    />
  );
}

function TimelineStepItem({ step }: { step: TimelineStep }) {
  return (
    <div
      className="relative flex flex-col gap-1"
      style={{ opacity: step.status === "upcoming" ? 0.6 : 1 }}
    >
      <StepDot status={step.status} />

      <div className="flex items-baseline gap-4">
        <span style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          {step.title}
        </span>
        <span
          style={{
            fontFamily: step.status === "current" ? "'JetBrains Mono', monospace" : "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: step.status === "current" ? 700 : 400,
            color: step.status === "current" ? "#000000" : "#8891a5",
            lineHeight: "19.5px",
          }}
        >
          {step.datetime}
        </span>
      </div>

      <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
        {step.description}
      </p>

      {step.status === "current" && step.progressPercent !== null && (
        <>
          <div
            className="relative overflow-hidden rounded-full"
            style={{
              height: 6,
              maxWidth: 384,
              backgroundColor: "rgba(223,226,236,0.8)",
              marginTop: 4,
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                backgroundColor: "#38bdf8",
                width: `${step.progressPercent}%`,
              }}
            />
          </div>
          {step.timeRemaining && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "#8891a5",
                lineHeight: "19.5px",
              }}
            >
              Time remaining: {step.timeRemaining}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function HackathonTimeline({ steps }: HackathonTimelineProps) {
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
        Timeline
      </h2>
      <div
        className="flex flex-col gap-6"
        style={{
          borderLeft: "2px solid rgba(198,198,205,0.3)",
          paddingLeft: 18,
          maxWidth: 643,
        }}
      >
        {steps.map((step) => (
          <TimelineStepItem key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}
