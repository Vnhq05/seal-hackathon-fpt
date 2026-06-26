"use client";

import { JoinRequestCard } from "@/features/teams/components/join-request-card";
import { useTeamJoinRequests, useJoinRequestMutations } from "@/features/teams/hooks/use-join-requests";

interface JoinRequestsSectionProps {
  eventId: string;
  teamId: string;
}

export function JoinRequestsSection({ eventId, teamId }: JoinRequestsSectionProps) {
  const { data, isLoading } = useTeamJoinRequests(eventId, teamId);
  const { accept, reject } = useJoinRequestMutations(eventId, teamId);
  const pending = (data ?? []).filter((r) => r.status === "PENDING");

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="h-4 w-32 animate-pulse rounded bg-seal-surface-elevated" />
        <div className="mt-2 h-12 animate-pulse rounded-lg bg-seal-surface-elevated" />
      </div>
    );
  }

  if (pending.length === 0) return null;

  return (
    <div className="mt-4 border-t border-seal-border-light pt-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-seal-text-muted">
          Join requests
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          {pending.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {pending.map((req) => (
          <JoinRequestCard
            key={req.id}
            request={req}
            onAccept={() => accept.mutate(req.id)}
            onReject={() => reject.mutate(req.id)}
            isAccepting={accept.isPending}
            isRejecting={reject.isPending}
          />
        ))}
      </div>
    </div>
  );
}
