"use client";

import { useState } from "react";
import { useLeaveRequestMutations } from "@/features/teams/hooks/use-leave-requests";

interface LeaveRequestDialogProps {
  eventId: string;
  teamId: string;
  teamName: string;
  onClose: () => void;
}

export function LeaveRequestDialog({ eventId, teamId, teamName, onClose }: LeaveRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { create } = useLeaveRequestMutations(eventId, teamId);

  const handleSubmit = async () => {
    setError(null);
    try {
      await create.mutateAsync(reason.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-seal-border bg-seal-surface p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-seal-text">Yêu cầu rời team</h3>
        <p className="mt-2 text-sm text-seal-text-muted">
          Gửi yêu cầu rời <strong className="text-seal-text">{teamName}</strong> tới ban tổ chức.
          Coordinator sẽ xem xét và phê duyệt.
        </p>
        <div className="mt-4">
          <label className="text-xs font-medium text-seal-text-secondary">Lý do (tùy chọn)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
            placeholder="Nêu lý do rời team..."
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={create.isPending}
            className="rounded-lg border border-seal-border px-4 py-2 text-sm font-medium text-seal-text-secondary hover:bg-seal-surface-sunken disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {create.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}
