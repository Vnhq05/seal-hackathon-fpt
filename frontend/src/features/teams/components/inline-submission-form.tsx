"use client";

import type { EventResponse, RoundResponse, SubmissionResponse } from "@/lib/api";
import { SubmissionPartsForm } from "@/features/submissions/components/submission-parts-form";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface InlineSubmissionFormProps {
  event: EventResponse;
  round: RoundResponse;
  teamId: string;
  existing: SubmissionResponse | null;
  onClose: () => void;
}

export function InlineSubmissionForm({ event, round, teamId, existing, onClose }: InlineSubmissionFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-seal-border p-5">
          <div>
            <h2 className="text-lg font-bold text-seal-text">{existing ? "Update submission" : "Submit"}</h2>
            <p className="text-xs text-seal-text-muted">
              {event.name} — {round.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated hover:text-seal-text"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <SubmissionPartsForm round={round} teamId={teamId} existing={existing} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-seal-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-navy bg-white px-5 py-2 text-xs font-semibold shadow-[4px_4px_0_0_#0c1228]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
