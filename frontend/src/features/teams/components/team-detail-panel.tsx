"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useRenameTeam } from "@/features/teams/hooks/use-rename-team";
import { useTeamSubmissions } from "@/features/teams/hooks/use-team-submissions";
import { InlineSubmissionForm } from "@/features/teams/components/inline-submission-form";
import { InvitePendingSection } from "@/features/teams/components/invite-pending-section";
import { JoinRequestsSection } from "@/features/teams/components/join-requests-section";
import { LeaveRequestDialog } from "@/features/teams/components/leave-request-dialog";
import { TeamRecruitmentSettings } from "@/features/teams/components/team-recruitment-settings";
import { TransferLeaderDialog } from "@/features/teams/components/transfer-leader-dialog";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";
import { enrollmentWaitingListKey } from "@/features/events/hooks/use-enrollment";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";
import { resolveEventTeamSize } from "@/features/events/utils/participation-gate.utils";
import { isRoundOpen, roundLockMessage } from "@/features/submissions/utils/round.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationApi, teamApi } from "@/lib/api";
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
  const { canModifyMembers, registrationClosedReason } = useEventParticipationGate(event);
  const isLeader = team.leaderId === user?.id;
  const isMember = team.members.some((m) => m.userId === user?.id && m.role !== "LEADER");
  const started = new Date() >= new Date(event.startDate);
  const canRename = isLeader && !started;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const { mutate: rename, isPending: renamePending } = useRenameTeam();

  const [inviteEmail, setInviteEmail] = useState("");
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const qc = useQueryClient();
  const { mutate: sendInvite, isPending: invitePending } = useMutation({
    mutationFn: (email: string) => invitationApi.send(team.id, { inviteeEmail: email }),
    onSuccess: () => {
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: ["pending-invites", team.id] });
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(event.id) });
    },
  });

  const { data: roundSubs, isLoading: roundsLoading } = useTeamSubmissions(event.id, team.id);
  const [activeRound, setActiveRound] = useState<RoundResponse | null>(null);

  const { minTeam: minMembers, maxTeam: maxMembers } = resolveEventTeamSize(
    event,
    team.minTeamMembers ?? 3,
    team.maxTeamMembers ?? 5,
  );
  const needsMoreMembers = team.memberCount < minMembers;
  const selectedTrack = event.tracks.find((t) => t.id === team.trackId);
  const isSeal = event.competitionFormat === "SEAL_RAG_2026";

  const { mutate: selectTrack, isPending: trackPending } = useMutation({
    mutationFn: (trackId: string) => teamApi.selectTrack(event.id, team.id, { trackId }),
    onSuccess: () => {
      setShowTrackPicker(false);
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
    },
  });

  const { mutate: removeMember, isPending: removing } = useMutation({
    mutationFn: (memberId: string) => teamApi.removeMember(event.id, team.id, memberId),
    onSuccess: () => {
      setKickTarget(null);
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(event.id) });
      qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY, event.id] });
    },
  });

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

  const confirmKick = () => {
    if (kickTarget) removeMember(kickTarget.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5">
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
                  className="h-8 flex-1 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-2 text-sm text-seal-text outline-none focus:border-royal/40"
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
          <span className="border-2 border-navy bg-white px-2.5 py-1 text-xs font-medium text-seal-text-secondary flex-shrink-0">
            {team.memberCount} / {maxMembers}
          </span>
        </div>

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

        {needsMoreMembers && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Team cần tối thiểu {minMembers} thành viên (bao gồm bạn) trước khi chọn track.
            Hiện có {team.memberCount} thành viên.
          </div>
        )}
        {!needsMoreMembers && !team.trackId && isLeader && !isSeal && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            Your team is ready. Select a track to complete registration.
          </div>
        )}
        {!needsMoreMembers && !team.trackId && isSeal && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            SEAL Hackathon: đội tự chọn bảng trong phiên bốc thăm do BTC tổ chức.
            {isLeader && (
              <>
                {" "}
                <Link href="/student/tracks/draw" className="font-semibold underline">
                  Vào trang bốc thăm
                </Link>
              </>
            )}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-seal-text-muted">Track:</span>
          {selectedTrack ? (
            <span className="rounded-md bg-seal-cyan/10 px-2.5 py-1 text-xs font-medium text-seal-cyan">
              {selectedTrack.name}
              {selectedTrack.topic && ` — ${selectedTrack.topic}`}
            </span>
          ) : isSeal ? (
            <Link
              href="/student/tracks/draw"
              className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono text-xs font-bold shadow-[4px_4px_0_0_#0c1228]"
            >
              {isLeader ? "Vào bốc thăm bảng" : "Xem trạng thái bốc thăm"}
            </Link>
          ) : team.canSelectTrack && isLeader ? (
            <button
              onClick={() => setShowTrackPicker((v) => !v)}
              className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
            >
              Chọn Track
            </button>
          ) : (
            <span
              className="text-xs text-seal-text-muted"
              title={needsMoreMembers ? `Cần ít nhất ${minMembers} thành viên` : undefined}
            >
              {needsMoreMembers && isLeader ? "Chưa đủ thành viên" : "Not selected"}
            </span>
          )}
        </div>
        {showTrackPicker && (
          <div className="mb-4 flex flex-wrap gap-2">
            {event.tracks.map((track) => (
              <button
                key={track.id}
                disabled={trackPending}
                onClick={() => selectTrack(track.id)}
                className="border-2 border-navy bg-white px-3 py-1.5 text-xs font-medium text-seal-text hover:border-royal/40 hover:bg-royal/5 disabled:opacity-50"
              >
                {track.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 mb-4">
          {team.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-seal-surface-sunken/50 px-3 py-2 text-sm">
              <span className="truncate text-seal-text">{m.fullName ?? m.email ?? `User ${m.userId}`}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {m.role === "LEADER" && (
                  <span className="rounded-md bg-seal-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-seal-cyan">
                    {m.userId === user?.id ? "Leader (you)" : "Leader"}
                  </span>
                )}
                {isLeader && m.role !== "LEADER" && (
                  <button
                    onClick={() => setKickTarget({ id: m.userId, name: m.fullName ?? m.email ?? "member" })}
                    disabled={removing || !canModifyMembers}
                    className="rounded-md border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!canModifyMembers && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">
            {registrationClosedReason ?? "Team member changes are closed for this event."}
          </div>
        )}

        {isLeader && team.memberCount < maxMembers && canModifyMembers && (
          <div className="mb-4">
            <label className="text-xs font-medium text-seal-text-secondary">Invite member</label>
            <div className="mt-1.5 flex gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="email@example.com"
                className="flex-1 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
              />
              <button
                onClick={handleInvite}
                disabled={invitePending}
                className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
              >
                {invitePending ? "Sending..." : "Invite"}
              </button>
            </div>
          </div>
        )}

        {isLeader && (
          <>
            <InvitePendingSection teamId={team.id} />
            <JoinRequestsSection eventId={event.id} teamId={team.id} canModifyMembers={canModifyMembers} />
            <div className="mt-4 flex flex-wrap gap-2 border-t border-seal-border-light pt-4">
              <button
                onClick={() => setShowTransferDialog(true)}
                disabled={team.members.length < 2 || !canModifyMembers}
                className="border-2 border-navy bg-white px-3 py-1.5 text-xs font-medium text-seal-text hover:bg-seal-surface-sunken disabled:opacity-50"
              >
                Transfer leadership
              </button>
            </div>
          </>
        )}

        {isMember && (
          <div className="mt-4 border-t border-seal-border-light pt-4">
            <button
              onClick={() => setShowLeaveDialog(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Yêu cầu rời team
            </button>
          </div>
        )}

        {!isLeader && !isMember && (
          <p className="text-xs text-seal-text-muted">Only the team leader can invite members.</p>
        )}
      </div>

      {isLeader && team.memberCount < maxMembers && canModifyMembers && (
        <TeamRecruitmentSettings eventId={event.id} team={team} />
      )}

      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5">
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-seal-text-muted">Rounds</div>
        {roundsLoading ? (
          <p className="text-sm text-seal-text-muted">Loading rounds...</p>
        ) : !roundSubs || roundSubs.length === 0 ? (
          <p className="text-sm text-seal-text-muted">No rounds configured yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {roundSubs.map(({ round, submission }) => {
              const roundOpen = isRoundOpen(round);
              const isLocked = !roundOpen;
              return (
                <div key={round.id} className="flex items-center justify-between border-2 border-navy bg-white p-3 shadow-[2px_2px_0_0_#0c1228]">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-seal-text">{round.name}</div>
                    <div className="text-xs text-seal-text-muted">
                      {round.startDate.slice(0, 16).replace("T", " ")} — {round.endDate.slice(0, 16).replace("T", " ")}
                    </div>
                    {isLocked && (
                      <div className="mt-1 text-[11px] text-amber-700">{roundLockMessage(round)}</div>
                    )}
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
                          : "border-2 border-navy bg-seal-yellow text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228]"
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

      {activeRound && (
        <InlineSubmissionForm
          event={event}
          round={activeRound}
          teamId={team.id}
          existing={roundSubs?.find((rs) => rs.round.id === activeRound.id)?.submission ?? null}
          onClose={() => setActiveRound(null)}
        />
      )}

      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 shadow-lg">
            <h3 className="font-semibold text-seal-text">Remove member?</h3>
            <p className="mt-2 text-sm text-seal-text-muted">
              Remove <strong>{kickTarget.name}</strong> from the team? They will return to the waiting list.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setKickTarget(null)} className="border-2 border-navy bg-white px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={confirmKick}
                disabled={removing}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveDialog && (
        <LeaveRequestDialog
          eventId={event.id}
          teamId={team.id}
          teamName={team.name}
          onClose={() => setShowLeaveDialog(false)}
        />
      )}

      {showTransferDialog && (
        <TransferLeaderDialog
          eventId={event.id}
          team={team}
          onClose={() => setShowTransferDialog(false)}
        />
      )}
    </div>
  );
}
