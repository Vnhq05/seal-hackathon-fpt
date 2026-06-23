"use client";

import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRenameTeam } from "@/features/teams/hooks/use-rename-team";
import { useTeamSubmissions } from "@/features/teams/hooks/use-team-submissions";
import { InlineSubmissionForm } from "@/features/teams/components/inline-submission-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi } from "@/lib/api";
import type { EventResponse, TeamResponse, RoundResponse } from "@/lib/api";

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 6V4a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 9V2M4 5l3-3 3 3M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface TeamDetailPanelProps {
  event: EventResponse;
  team: TeamResponse;
}

export function TeamDetailPanel({ event, team }: TeamDetailPanelProps) {
  const { user } = useAuthStore();
  const isLeader = team.leaderId === user?.id;
  const started = new Date() >= new Date(event.startDate);
  const canRename = isLeader && !started;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const { mutate: rename, isPending: renamePending } = useRenameTeam();

  const [inviteEmail, setInviteEmail] = useState("");
  const qc = useQueryClient();
  const { mutate: sendInvite, isPending: invitePending } = useMutation({
    mutationFn: (email: string) => invitationApi.send(team.id, { inviteeEmail: email }),
    onSuccess: () => {
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
    },
  });

  const { data: roundSubs, isLoading: roundsLoading } = useTeamSubmissions(event.id, team.id);
  const [activeRound, setActiveRound] = useState<RoundResponse | null>(null);

  const saveName = () => {
    const next = name.trim();
    if (!next) return;
    if (next === team.name) { setEditing(false); return; }
    rename({ eventId: event.id, teamId: team.id, name: next }, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    sendInvite(email);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Team Info */}
      <div className="rounded-lg border border-seal-border bg-seal-surface p-5">
        {/* Name + edit */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seal-cyan/10 text-seal-cyan flex-shrink-0">
            <svg width="18" height="14" viewBox="0 0 22 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1 15c0-3.314 3.134-6 7-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="16" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M21 15c0-2.761-2.239-5-5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-seal-border bg-seal-surface px-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
                  autoFocus
                />
                <button onClick={saveName} disabled={renamePending} className="p-1 text-emerald-600"><CheckIcon /></button>
                <button onClick={() => { setName(team.name); setEditing(false); }} className="p-1 text-seal-text-muted"><XIcon /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-seal-text truncate">{team.name}</span>
                {canRename && (
                  <button onClick={() => setEditing(true)} className="text-seal-text-muted hover:text-seal-text"><PencilIcon /></button>
                )}
                {isLeader && started && (
                  <span className="flex items-center gap-1 text-[11px] text-seal-text-muted"><LockIcon /> locked</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-seal-text-muted">
              Status: <span className="rounded-md bg-seal-surface-elevated px-2 py-0.5 font-medium">{team.status}</span>
            </div>
          </div>
          <span className="rounded-lg border border-seal-border px-2.5 py-1 text-xs font-medium text-seal-text-secondary flex-shrink-0">
            {team.memberCount} members
          </span>
        </div>

        {/* Event info bar */}
        <div className="rounded-lg border border-seal-border-light bg-seal-surface-sunken p-3 mb-4 flex flex-wrap gap-3 text-xs text-seal-text-muted">
          <span>{event.name}</span>
          <span>{event.season} {event.year}</span>
          <span>{event.startDate?.slice(0, 10)} — {event.endDate?.slice(0, 10)}</span>
          {event.location && <span>{event.location}</span>}
          <span className={`rounded-full px-2 py-0.5 font-medium ${
            event.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
            event.status === "OPEN" ? "bg-blue-50 text-blue-700" :
            "bg-gray-100 text-gray-500"
          }`}>{event.status}</span>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-1 mb-4">
          {team.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-seal-surface-sunken/50 px-3 py-2 text-sm">
              <span className="truncate text-seal-text">{m.fullName ?? m.email ?? `User ${m.userId}`}</span>
              {m.role === "LEADER" && (
                <span className="rounded-md bg-seal-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-seal-cyan">
                  {m.userId === user?.id ? "Leader (you)" : "Leader"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Invite member */}
        {isLeader ? (
          <div>
            <label className="text-xs font-medium text-seal-text-secondary">Invite member</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="email@example.com"
                className="flex-1 rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
              />
              <button
                onClick={handleInvite}
                disabled={invitePending}
                className="rounded-lg bg-seal-cyan px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-seal-cyan-dark disabled:opacity-50"
              >
                {invitePending ? "Sending..." : "Invite"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-seal-text-muted">
              An invitation will be sent. They must accept to join.
            </p>
          </div>
        ) : (
          <p className="text-xs text-seal-text-muted">Only the team leader can invite members.</p>
        )}
      </div>

      {/* Rounds / Submissions */}
      <div className="rounded-lg border border-seal-border bg-seal-surface p-5">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-seal-text-muted">Rounds</div>
        {roundsLoading ? (
          <p className="text-sm text-seal-text-muted">Loading rounds...</p>
        ) : !roundSubs || roundSubs.length === 0 ? (
          <p className="text-sm text-seal-text-muted">No rounds configured yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {roundSubs.map(({ round, submission }) => {
              const deadline = round.submissionDeadline;
              const isLocked = new Date() > new Date(round.submissionDeadline);
              return (
                <div key={round.id} className="flex items-center justify-between rounded-lg border border-seal-border p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-seal-text">{round.name}</div>
                    <div className="text-xs text-seal-text-muted">
                      Due {deadline?.slice(0, 16).replace("T", " ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {submission && (
                      <span className="rounded-md bg-seal-surface-elevated px-2 py-0.5 text-[10px] font-medium text-seal-text-secondary">
                        {submission.status}
                      </span>
                    )}
                    <button
                      disabled={!isLeader || isLocked}
                      onClick={() => setActiveRound(round)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isLocked
                          ? "bg-seal-surface-elevated text-seal-text-muted"
                          : "bg-seal-cyan text-white hover:bg-seal-cyan-dark"
                      } disabled:opacity-50`}
                    >
                      {isLocked ? <><LockIcon /> Locked</> : <><UploadIcon /> {submission ? "Edit" : "Submit"}</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isLeader && roundSubs && roundSubs.length > 0 && (
          <p className="mt-3 text-xs text-seal-text-muted">Only the team leader can submit work.</p>
        )}
      </div>

      {/* Submission Form Modal */}
      {activeRound && (
        <InlineSubmissionForm
          event={event}
          round={activeRound}
          teamId={team.id}
          existing={roundSubs?.find((rs) => rs.round.id === activeRound.id)?.submission ?? null}
          onClose={() => setActiveRound(null)}
        />
      )}
    </div>
  );
}
