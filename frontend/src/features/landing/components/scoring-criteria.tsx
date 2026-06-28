"use client";

import { useState } from "react";
import { SCORING_ROUNDS } from "@/lib/landing-data";
import { SectionHeading } from "./landing-ui";

export function ScoringCriteria() {
  const [activeRound, setActiveRound] = useState<"group" | "finals">("group");
  const round = SCORING_ROUNDS.find((r) => r.id === activeRound) ?? SCORING_ROUNDS[0];

  return (
    <section id="scoring" className="bg-seal-surface-sunken py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Scoring Criteria"
          description="Judges evaluate teams using dedicated rubrics for the Group Round and Finals."
          align="center"
        />

        <div className="mt-10 flex justify-center gap-2">
          {SCORING_ROUNDS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRound(r.id)}
              className={`border-2 px-4 py-2 font-mono text-xs font-bold transition-colors ${
                activeRound === r.id
                  ? "border-navy bg-navy text-white shadow-[3px_3px_0_0_#0c1228]"
                  : "border-navy/20 bg-white text-navy hover:border-navy/40"
              }`}
              aria-pressed={activeRound === r.id}
            >
              {r.label}
              <span className="ml-1.5 font-normal opacity-75">({r.subtitle})</span>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <div className="border-b-2 border-navy/10 bg-seal-surface-sunken px-5 py-3">
            <h3 className="font-mono text-sm font-bold text-navy">
              {round.label} <span className="text-seal-text-secondary">({round.subtitle})</span>
            </h3>
          </div>
          <ul className="divide-y divide-navy/10">
            {round.criteria.map((criterion) => (
              <li
                key={criterion.name}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <span className="font-mono text-sm text-navy">{criterion.name}</span>
                <span className="shrink-0 font-mono text-lg font-bold text-royal">
                  {criterion.weight}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
