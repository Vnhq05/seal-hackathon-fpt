"use client";

import { useState } from "react";
import type { CompetitionRound } from "@/features/events/types/hackathon-detail.types";

interface HackathonRoundsProps {
  rounds: CompetitionRound[];
}

function RoundAccordion({ round, defaultOpen }: { round: CompetitionRound; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between"
        style={{
          padding: "15.5px 16px 15.69px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          {round.title}
        </span>
        <svg
          width="12"
          height="7"
          viewBox="0 0 12 7"
          fill="none"
          aria-hidden="true"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        >
          <path
            d="M1 1l5 5 5-5"
            stroke="#0e1528"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            backgroundColor: "#eef0f6",
            borderTop: "1px solid rgba(198,198,205,0.5)",
            padding: "17px 16px 16px",
          }}
        >
          <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
            {round.description}
          </p>
        </div>
      )}
    </div>
  );
}

export function HackathonRounds({ rounds }: HackathonRoundsProps) {
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
        Competition Rounds
      </h2>
      <div className="flex flex-col gap-2">
        {rounds.map((round, i) => (
          <RoundAccordion key={round.id} round={round} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}
