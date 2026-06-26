"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { EventResponse } from "@/lib/api";
import type { JoinableTeamResponse } from "@/lib/api/join-request.api";
import { useJoinableTeams } from "@/features/teams/hooks/use-joinable-teams";
import { useMyJoinRequests, useJoinRequestMutations } from "@/features/teams/hooks/use-join-requests";

interface JoinTeamPanelProps {
  event: EventResponse;
}

function JoinTeamCard({
  team,
  eventId,
  onJoined,
}: {
  team: JoinableTeamResponse;
  eventId: string;
  onJoined: () => void;
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
    <div className="rounded-lg border border-seal-border bg-seal-surface-sunken/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-seal-text truncate">{team.name}</div>
          <div className="mt-1 text-xs text-seal-text-muted">
            Leader: {team.leaderFullName || team.leaderEmail || "—"}
          </div>
          {team.leaderEmail && team.leaderFullName && (
            <div className="text-xs text-seal-text-muted truncate">{team.leaderEmail}</div>
          )}
          <div className="mt-2 text-xs text-seal-text-secondary">
            {team.memberCount} / {team.maxTeamMembers} members
          </div>
        </div>
        <button
          onClick={handleJoin}
          disabled={create.isPending || sent}
          className="flex-shrink-0 rounded-lg bg-seal-cyan px-3 py-1.5 text-xs font-semibold text-white hover:bg-seal-cyan-dark disabled:opacity-50"
        >
          {sent ? "Request sent" : create.isPending ? "Sending..." : "Join team"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function JoinTeamPanel({ event }: JoinTeamPanelProps) {
  const { data: teams, isLoading } = useJoinableTeams(event.id);
  const { data: myRequests } = useMyJoinRequests(event.id);
  const pendingRequest = myRequests?.find((r) => r.status === "PENDING");

  if (pendingRequest) {
    return (
      <div className="rounded-lg border border-seal-border bg-seal-surface p-6">
        <h2 className="text-lg font-semibold text-seal-text">Join a team</h2>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You have a pending join request for team <strong>{pendingRequest.teamName}</strong>.
          Wait for the leader to accept or reject before joining another team.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface p-6">
      <h2 className="text-lg font-semibold text-seal-text">Join a team</h2>
      <p className="mt-1 text-sm text-seal-text-muted">
        Browse teams with available slots in <span className="font-medium text-seal-text">{event.name}</span>.
        Your request must be accepted by the team leader.
      </p>

      {isLoading ? (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-seal-surface-elevated" />
          ))}
        </div>
      ) : !teams || teams.length === 0 ? (
        <p className="mt-4 text-sm text-seal-text-muted">
          Chưa có team nào còn slot. Hãy tạo team mới hoặc quay lại sau.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {teams.map((team) => (
            <JoinTeamCard key={team.id} team={team} eventId={event.id} onJoined={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
