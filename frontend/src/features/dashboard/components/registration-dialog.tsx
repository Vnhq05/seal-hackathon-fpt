"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, invitationApi } from "@/lib/api";
import { enrollmentMyKey } from "@/features/events/hooks/use-enrollment";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { EventResponse } from "@/lib/api";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface RegistrationDialogProps {
  event: EventResponse;
  onClose: () => void;
}

export function RegistrationDialog({ event, onClose }: RegistrationDialogProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"team" | "solo">("team");
  const [teamName, setTeamName] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutateAsync: createTeam, isPending } = useMutation({
    mutationFn: (name: string) => teamApi.create(event.id, { name }),
  });

  const handleSubmitTeam = async () => {
    setError(null);
    setSuccess(null);

    const name = teamName.trim();
    if (!name) { setError("Team name is required"); return; }

    const emails = memberEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const min = event.minTeam ?? 1;
    const max = event.maxTeam ?? 10;
    const total = emails.length + 1;

    if (total < min || total > max) {
      setError(`Team size must be ${min}–${max} (you have ${total} including you).`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        setError(`Invalid email: ${email}`);
        return;
      }
    }

    if (new Set(emails).size !== emails.length) {
      setError("Duplicate member email");
      return;
    }

    if (user?.email && emails.includes(user.email.toLowerCase())) {
      setError("Member emails must not include your own email");
      return;
    }

    try {
      const created = await createTeam(name);

      const failed: string[] = [];
      for (const email of emails) {
        try {
          await invitationApi.send(created.id, { inviteeEmail: email });
        } catch {
          failed.push(email);
        }
      }

      if (failed.length) {
        setSuccess(`Team "${name}" created, but couldn't invite: ${failed.join(", ")}`);
      } else {
        setSuccess(`Team "${name}" registered for ${event.name}!`);
      }

      qc.invalidateQueries({ queryKey: enrollmentMyKey(event.id) });
      qc.invalidateQueries({ queryKey: ["dashboard-team"] });

      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register team");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-seal-border p-5">
          <h2 className="text-lg font-bold text-seal-text">Register for {event.name}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-seal-text-muted transition-colors hover:bg-seal-surface-elevated hover:text-seal-text">
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-seal-border px-5 pt-4 pb-0">
          {(["team", "solo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-b-2 border-navy text-navy font-mono font-bold"
                  : "text-seal-text-muted hover:text-seal-text"
              }`}
            >
              {t === "team" ? "Team mode" : "Solo mode"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === "team" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-seal-text-secondary">Team name</label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none transition-colors focus:border-royal/40 focus:ring-2 focus:ring-seal-cyan/10"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-seal-text-secondary">Leader (you)</label>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="mt-1.5 w-full border-2 border-navy bg-seal-surface-sunken shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text-muted"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-seal-text-secondary">Member emails</label>
                <textarea
                  value={memberEmails}
                  onChange={(e) => setMemberEmails(e.target.value)}
                  placeholder="alice@example.com, bob@example.com"
                  rows={3}
                  className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none transition-colors focus:border-royal/40 focus:ring-2 focus:ring-seal-cyan/10"
                />
                <p className="mt-1 text-[11px] text-seal-text-muted">
                  Comma-separated. Team size: {event.minTeam ?? 1}–{event.maxTeam ?? 10} including you.
                </p>
              </div>

              <button
                onClick={handleSubmitTeam}
                disabled={isPending}
                className="w-full border-2 border-navy bg-seal-yellow py-2.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit team registration"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-seal-text-secondary">
                Solo registration lets the system auto-match you into a team before the competition starts.
                If auto-matching is not possible, you may not be eligible to participate.
              </p>
              <p className="text-xs text-seal-text-muted">
                This feature is not yet available. Please register with a team.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>
          )}
          {success && (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>
          )}
        </div>
      </div>
    </div>
  );
}
