"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/lib/api";
import type { TeamResponse } from "@/lib/api";

interface TransferLeaderDialogProps {
  eventId: string;
  team: TeamResponse;
  onClose: () => void;
}

export function TransferLeaderDialog({ eventId, team, onClose }: TransferLeaderDialogProps) {
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const members = team.members.filter((m) => m.role !== "LEADER");

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (newLeaderId: string) =>
      teamApi.transferLeadership(eventId, team.id, newLeaderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!selectedId) return;
    setError(null);
    try {
      await mutateAsync(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer leadership");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-seal-border bg-seal-surface p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-seal-text">Transfer leadership</h3>
        <p className="mt-2 text-sm text-seal-text-muted">
          Chọn thành viên sẽ trở thành leader mới của team.
        </p>
        {members.length === 0 ? (
          <p className="mt-4 text-sm text-seal-text-muted">Không có thành viên để chuyển quyền.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-seal-border px-3 py-2 hover:bg-seal-surface-sunken"
              >
                <input
                  type="radio"
                  name="newLeader"
                  value={m.userId}
                  checked={selectedId === m.userId}
                  onChange={() => setSelectedId(m.userId)}
                />
                <span className="text-sm text-seal-text">{m.fullName || m.email}</span>
              </label>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-seal-border px-4 py-2 text-sm font-medium text-seal-text-secondary hover:bg-seal-surface-sunken"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !selectedId}
            className="rounded-lg bg-seal-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-seal-cyan-dark disabled:opacity-50"
          >
            {isPending ? "Transferring..." : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
