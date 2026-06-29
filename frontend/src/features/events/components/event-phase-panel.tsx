"use client";

import { useState } from "react";
import type { EventStatus } from "@/lib/api/types";
import { useUpdateEventStatus } from "@/features/admin/hooks/use-admin-hackathons";
import {
  allowedNextStatuses,
  isIrreversibleTransition,
  statusActionLabel,
  STATUS_DISPLAY_LABELS,
  type TransitionTargetStatus,
} from "@/features/events/utils/event-status.utils";
import { SealCard } from "@/shared/ui/seal-card";
import { SealButton } from "@/shared/ui/seal-button";

const STATUS_COLORS: Record<EventStatus, string> = {
  UPCOMING: "bg-sky-50 text-sky-800 border-sky-200",
  OPEN: "bg-sky-100 text-sky-900 border-sky-300",
  CLOSED_REGISTRATION: "bg-amber-50 text-amber-900 border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-900 border-emerald-200",
  SCORING: "bg-violet-50 text-violet-900 border-violet-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-50 text-red-900 border-red-200",
};

export function EventPhasePanel({
  eventId,
  currentStatus,
  onStatusChanged,
}: {
  eventId: string;
  currentStatus: EventStatus;
  onStatusChanged?: (status: EventStatus) => void;
}) {
  const [pendingTarget, setPendingTarget] = useState<TransitionTargetStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutate: updateStatus, isPending } = useUpdateEventStatus();

  const nextStatuses = allowedNextStatuses(currentStatus);

  const executeTransition = (target: TransitionTargetStatus) => {
    setError(null);
    updateStatus(
      { eventId, status: target },
      {
        onSuccess: (data) => {
          setPendingTarget(null);
          onStatusChanged?.(data.status);
        },
        onError: (err) => {
          setPendingTarget(null);
          setError(err instanceof Error ? err.message : "Failed to update event status");
        },
      },
    );
  };

  const handleAction = (target: TransitionTargetStatus) => {
    if (isIrreversibleTransition(target)) {
      setPendingTarget(target);
      return;
    }
    executeTransition(target);
  };

  if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") {
    return (
      <SealCard className="space-y-2 p-4">
        <h2 className="font-mono text-sm font-bold text-navy">Event Phase</h2>
        <span
          className={`inline-flex rounded border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus]}`}
        >
          {STATUS_DISPLAY_LABELS[currentStatus]}
        </span>
        <p className="text-sm text-seal-text-muted">No further phase transitions available.</p>
      </SealCard>
    );
  }

  return (
    <SealCard className="space-y-4 p-4">
      <div>
        <h2 className="font-mono text-sm font-bold text-navy">Event Phase</h2>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Transition the competition through registration, competition day, scoring, and completion.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-seal-text-muted">Current:</span>
        <span
          className={`inline-flex rounded border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[currentStatus]}`}
        >
          {STATUS_DISPLAY_LABELS[currentStatus]}
        </span>
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((target) => (
            <SealButton
              key={target}
              type="button"
              variant={target === "CLOSED_REGISTRATION" || target === "COMPLETED" ? "secondary" : "primary"}
              disabled={isPending}
              onClick={() => handleAction(target)}
            >
              {statusActionLabel(target)}
            </SealButton>
          ))}
        </div>
      )}

      {pendingTarget && (
        <div className="rounded border border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-sm text-amber-950">
            Confirm phase change to <strong>{STATUS_DISPLAY_LABELS[pendingTarget]}</strong>?
            {pendingTarget === "CLOSED_REGISTRATION" &&
              " Team member changes will be blocked after this step."}
          </p>
          <div className="flex gap-2">
            <SealButton type="button" disabled={isPending} onClick={() => executeTransition(pendingTarget)}>
              {isPending ? "Updating..." : "Confirm"}
            </SealButton>
            <SealButton
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => setPendingTarget(null)}
            >
              Cancel
            </SealButton>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </SealCard>
  );
}
