"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentWaitingListKey } from "@/features/events/hooks/use-enrollment";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";
import { teamApi } from "@/lib/api";

interface LeaveTeamDialogProps {
  eventId: string;
  teamId: string;
  teamName: string;
  onClose: () => void;
}

export function LeaveTeamDialog({ eventId, teamId, teamName, onClose }: LeaveTeamDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { mutate: leave, isPending } = useMutation({
    mutationFn: () => teamApi.leaveTeam(eventId, teamId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(eventId) });
      qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY, eventId] });
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to leave team");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 shadow-lg">
        <h3 className="font-semibold text-seal-text">Leave team?</h3>
        <p className="mt-2 text-sm text-seal-text-muted">
          Are you sure you want to leave <strong className="text-seal-text">{teamName}</strong>?
          You can only leave before the competition starts. You will return to the waiting list
          and can join another team.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="border-2 border-navy bg-white px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => leave()}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Leaving..." : "Leave team"}
          </button>
        </div>
      </div>
    </div>
  );
}
