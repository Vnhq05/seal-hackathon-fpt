"use client";

import { useState } from "react";
import { useEventRounds } from "@/features/dashboard/hooks/use-event-rounds";
import { useEnroll, useWithdrawEnrollment } from "@/features/events/hooks/use-enrollment";
import type { EventResponse, EnrollmentResponse } from "@/lib/api";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface-sunken p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-seal-text-muted">{label}</div>
      <div className="mt-0.5 text-sm text-seal-text">{value}</div>
    </div>
  );
}

interface EventDetailDialogProps {
  event: EventResponse;
  onClose: () => void;
  canRegister: boolean;
  activeEnrollment: EnrollmentResponse | null | undefined;
  allEvents?: EventResponse[];
}

export function EventDetailDialog({ event, onClose, canRegister, activeEnrollment, allEvents }: EventDetailDialogProps) {
  const { data: rounds } = useEventRounds(event.id);
  const { mutateAsync: enroll, isPending: enrolling } = useEnroll(event.id);
  const { mutateAsync: withdraw, isPending: withdrawing } = useWithdrawEnrollment(event.id);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEnrolledHere = activeEnrollment?.eventId === event.id;
  const isEnrolledElsewhere = activeEnrollment != null && activeEnrollment.eventId !== event.id;
  const enrolledEventName = isEnrolledElsewhere
    ? allEvents?.find((e) => e.id === activeEnrollment.eventId)?.name ?? "another competition"
    : null;

  const handleRegister = async () => {
    setError(null);
    try {
      await enroll();
      setSuccess("Successfully joined the competition!");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    try {
      await withdraw();
      setSuccess("Withdrawn from the competition.");
      setTimeout(() => {
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl rounded-xl border border-seal-border bg-seal-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-seal-border p-6">
          <div>
            <h2 className="text-xl font-bold text-seal-text">{event.name}</h2>
            <p className="mt-1 text-sm text-seal-text-secondary">{event.description ?? ""}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-seal-text-muted transition-colors hover:bg-seal-surface-elevated hover:text-seal-text">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Format" value={event.format || "—"} />
              <Field label="Location" value={event.location || "—"} />
              <Field label="Start" value={event.startDate ? event.startDate.slice(0, 10) : "—"} />
              <Field label="End" value={event.endDate ? event.endDate.slice(0, 10) : "—"} />
              <Field label="Team size" value={`${event.minTeam ?? "—"} – ${event.maxTeam ?? "—"}`} />
              <Field label="Registration deadline" value={event.registrationDeadline ? event.registrationDeadline.slice(0, 10) : "—"} />
            </div>

            {/* Rounds */}
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-seal-text-muted">Rounds</div>
              {!rounds || rounds.length === 0 ? (
                <p className="text-sm text-seal-text-muted">—</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rounds.map((r) => (
                    <div key={r.id} className="rounded-lg border border-seal-border p-3">
                      <div className="text-sm font-medium text-seal-text">{r.name}</div>
                      <div className="mt-0.5 text-xs text-seal-text-muted">
                        {r.startDate.slice(0, 10)} — {r.endDate.slice(0, 10)} | Submission deadline: {r.submissionDeadline.slice(0, 10)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prizes */}
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-seal-text-muted">Prizes</div>
              {event.prizes.length === 0 ? (
                <p className="text-sm text-seal-text-muted">—</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {event.prizes.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-seal-border p-3">
                      <span className="text-sm font-medium text-seal-text">
                        {p.rank} <span className="text-xs text-seal-text-muted">x{p.quantity}</span>
                      </span>
                      <span className="text-sm text-seal-text-secondary">{p.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Honored Guests */}
            {event.honoredGuests.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-seal-text-muted">Honored Guests</div>
                <div className="flex flex-wrap gap-2">
                  {event.honoredGuests.map((g) => (
                    <span key={g.id} className="rounded-lg bg-seal-surface-elevated px-3 py-1 text-xs font-medium text-seal-text-secondary">
                      {g.fullName}{g.title ? ` — ${g.title}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-seal-border p-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>
          )}

          {isEnrolledElsewhere && !success && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700">
              You are currently enrolled in <span className="font-bold">{enrolledEventName}</span>. Withdraw from that competition first to register here.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {isEnrolledHere ? (
              <>
                <span className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                  Enrolled
                </span>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="rounded-lg border border-red-200 bg-red-50 px-5 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  {withdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </>
            ) : canRegister && event.status === "OPEN" && !isEnrolledElsewhere ? (
              <button
                onClick={handleRegister}
                disabled={enrolling}
                className="rounded-lg bg-seal-cyan px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-seal-cyan-dark disabled:opacity-50"
              >
                {enrolling ? "Registering..." : "Register"}
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="rounded-lg border border-seal-border bg-seal-surface px-5 py-2 text-xs font-semibold text-seal-text transition-colors hover:bg-seal-surface-elevated"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
