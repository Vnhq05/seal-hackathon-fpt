"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EventResponse } from "@/lib/api";
import type { JoinableTeamResponse } from "@/lib/api/join-request.api";
import { HACKATHON_SKILL_ROLE_LABELS } from "@/lib/api/types";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";
import { useJoinableTeams } from "@/features/teams/hooks/use-joinable-teams";
import { useMyJoinRequests, useJoinRequestMutations } from "@/features/teams/hooks/use-join-requests";

interface JoinTeamPanelProps {
  event: EventResponse;
}

function JoinTeamCard({
  team,
  eventId,
  onJoined,
  registrationClosed,
}: {
  team: JoinableTeamResponse;
  eventId: string;
  onJoined: () => void;
  registrationClosed: boolean;
}) {
  const { create } = useJoinRequestMutations(eventId);
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleJoin = async () => {
    setError(null);
    try {
      await create.mutateAsync({ teamId: team.id });
      setSent(true);
      qc.invalidateQueries({ queryKey: ["my-join-requests", eventId] });
      onJoined();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send join request");
    }
  };

  return (
    <div className="border-2 border-navy bg-seal-surface-sunken/50 shadow-[4px_4px_0_0_#0c1228] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-seal-text truncate">{team.name}</div>
            {team.isRecruiting && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Recruiting
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-seal-text-muted">
            Leader: {team.leaderFullName || "—"}
          </div>
          <div className="mt-2 text-xs text-seal-text-secondary">
            {team.memberCount} / {team.maxTeamMembers} members
          </div>
          {team.recruitmentNote && (
            <p className="mt-2 text-xs text-seal-text line-clamp-3">{team.recruitmentNote}</p>
          )}
          {team.neededRoles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {team.neededRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-md bg-seal-cyan/10 px-2 py-0.5 text-[10px] font-medium text-seal-cyan"
                >
                  {HACKATHON_SKILL_ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleJoin}
          disabled={create.isPending || sent || registrationClosed}
          className="flex-shrink-0 border-2 border-navy bg-seal-yellow px-3 py-1.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {sent ? "Request sent" : create.isPending ? "Sending..." : "Join team"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function JoinTeamPanel({ event }: JoinTeamPanelProps) {
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const { canModifyMembers, registrationClosedReason } = useEventParticipationGate(event);
  const registrationClosed = !canModifyMembers;
  const { data: teams, isLoading } = useJoinableTeams(event.id, { recruitingOnly });
  const { data: myRequests } = useMyJoinRequests(event.id);
  const pendingRequest = myRequests?.find((r) => r.status === "PENDING");

  if (pendingRequest) {
    return (
      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
        <h2 className="text-lg font-semibold text-seal-text">Join a team</h2>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You have a pending join request for team <strong>{pendingRequest.teamName}</strong>.
          Wait for the leader to accept or reject before joining another team.
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
      <h2 className="text-lg font-semibold text-seal-text">Join a team</h2>
      <p className="mt-1 text-sm text-seal-text-muted">
        Browse teams with available slots in <span className="font-medium text-seal-text">{event.name}</span>.
        Your request must be accepted by the team leader.
      </p>

      {registrationClosed && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">
          {registrationClosedReason ?? "Registration is closed. Join requests are no longer accepted."}
        </div>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-seal-text">
        <input
          type="checkbox"
          checked={recruitingOnly}
          onChange={(e) => setRecruitingOnly(e.target.checked)}
          className="rounded border-seal-border"
        />
        Recruiting teams only
      </label>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-seal-surface-elevated" />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <p className="mt-4 text-sm text-seal-text-muted">
          {recruitingOnly
            ? "No teams are actively recruiting right now."
            : "Chưa có team nào còn slot. Hãy tạo team mới hoặc quay lại sau."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {teams.map((team) => (
            <JoinTeamCard
              key={team.id}
              team={team}
              eventId={event.id}
              onJoined={() => {}}
              registrationClosed={registrationClosed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
