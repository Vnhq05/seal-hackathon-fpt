"use client";

import type { TrackRoundTimeline } from "@/features/lecturer-mentor/types/mentor-track.types";

const STATUS_COLORS: Record<string, { dot: string; text: string; label: string }> = {
  complete: { dot: "#10b981", text: "#10b981", label: "COMPLETE" },
  active: { dot: "#38bdf8", text: "#38bdf8", label: "ACTIVE" },
  upcoming: { dot: "rgba(223,226,236,0.8)", text: "#8891a5", label: "UPCOMING" },
};

function CheckIcon() {
  return (
    <svg width="7" height="5" viewBox="0 0 7 5" fill="none" aria-hidden="true">
      <path d="M1 2.5L2.8 4.3L6 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  rounds: TrackRoundTimeline[];
}

export function MentorRoundsTimeline({ rounds }: Props) {
  return (
    <div
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        backdropFilter: "blur(5px)",
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px", marginBottom: 24 }}>
        Rounds Timeline
      </h2>

      <div style={{ borderLeft: "1px solid rgba(223,226,236,0.8)", paddingLeft: 1, paddingBottom: 16 }}>
        <div className="flex flex-col gap-8">
          {rounds.map((round) => {
            const colors = STATUS_COLORS[round.status] ?? STATUS_COLORS.upcoming;
            const isComplete = round.status === "complete";
            const isActive = round.status === "active";
            const isUpcoming = round.status === "upcoming";

            return (
              <div key={round.id} style={{ position: "relative", paddingLeft: 24 }}>
                {isComplete && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      position: "absolute", left: -9, top: 4,
                      width: 16, height: 16, borderRadius: 9999,
                      backgroundColor: "#10b981", border: "2px solid #ffffff",
                    }}
                  >
                    <CheckIcon />
                  </div>
                )}
                {isActive && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      position: "absolute", left: -11, top: 4,
                      width: 20, height: 20, borderRadius: 9999,
                      backgroundColor: "#ffffff", border: "2px solid #38bdf8",
                      boxShadow: "0px 0px 0px 2px rgba(99,102,241,0.2)",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: "#38bdf8" }} />
                  </div>
                )}
                {isUpcoming && (
                  <div style={{
                    position: "absolute", left: -9, top: 4,
                    width: 16, height: 16, borderRadius: 9999,
                    backgroundColor: "rgba(223,226,236,0.8)", border: "2px solid #ffffff",
                  }} />
                )}

                <div style={{ opacity: isComplete || isUpcoming ? 0.6 : 1 }}>
                  <p style={{
                    fontSize: 12, fontWeight: 500, color: colors.text,
                    letterSpacing: "0.6px", textTransform: "uppercase", lineHeight: "12px",
                  }}>
                    {colors.label}
                  </p>
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: "#0e1528",
                    letterSpacing: "0.24px", lineHeight: "12px", marginTop: 4,
                  }}>
                    {round.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#8891a5", lineHeight: "18px", marginTop: 4 }}>
                    {round.dateRange}
                  </p>
                </div>

                {round.note && (
                  <div
                    className="rounded-md"
                    style={{
                      backgroundColor: "rgba(223,226,236,0.8)",
                      border: "1px solid rgba(198,198,205,0.3)",
                      padding: "21px 13px 13px",
                      marginTop: 4,
                      fontSize: 12, fontWeight: 400, color: "#8891a5", lineHeight: "18px",
                    }}
                  >
                    {round.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
