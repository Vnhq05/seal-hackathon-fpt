"use client";

import type { TeamJoinRequestResponse } from "@/lib/api/join-request.api";

interface JoinRequestCardProps {
  request: TeamJoinRequestResponse;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function JoinRequestCard({
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: JoinRequestCardProps) {
  const sentAt = new Date(request.createdAt).toLocaleString();

  return (
    <div className="flex items-center justify-between rounded-lg border border-seal-border-light bg-seal-surface-sunken/50 px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium text-seal-text truncate">
          {request.requesterFullName || request.requesterEmail || "Unknown"}
        </div>
        {request.requesterEmail && (
          <div className="text-xs text-seal-text-muted truncate">{request.requesterEmail}</div>
        )}
        <div className="text-[11px] text-seal-text-muted mt-0.5">{sentAt}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onAccept}
          disabled={isAccepting || isRejecting}
          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          disabled={isAccepting || isRejecting}
          className="rounded-md border border-red-200 px-2.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
