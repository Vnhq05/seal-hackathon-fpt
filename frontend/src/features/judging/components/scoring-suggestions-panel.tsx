"use client";

import Link from "next/link";
import type { ScoringEventSuggestion } from "@/features/judging/types/judge.types";

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ScoringSuggestionsPanelProps {
  suggestions: ScoringEventSuggestion[];
  portalBase?: string;
}

/**
 * Shows one recommendation card per event that still needs scoring.
 * Hidden entirely when the judge has finished all assigned scoring.
 */
export function ScoringSuggestionsPanel({
  suggestions,
  portalBase = "/lecturer",
}: ScoringSuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold text-seal-text">Suggested scoring</h3>
        <p className="mt-0.5 text-xs text-seal-text-muted">
          Events that still need your scores. Fully scored events are hidden.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {suggestions.map((s) => (
          <li
            key={s.eventId}
            className="flex flex-wrap items-center justify-between gap-3 border-2 border-navy bg-white p-4 shadow-[4px_4px_0_0_#0c1228]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-sm font-bold text-navy">{s.eventName}</p>
              <p className="mt-1 text-xs text-seal-text-secondary">
                {s.roundName} · {s.remaining} of {s.total} team{s.total === 1 ? "" : "s"} left ·{" "}
                Deadline {formatDeadline(s.deadline)}
              </p>
            </div>
            <Link
              href={`${portalBase}/rounds/${s.roundId}`}
              className="inline-flex shrink-0 items-center border-2 border-navy bg-seal-yellow px-4 py-2 text-xs text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
            >
              Score now
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
