"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, invitationApi } from "@/lib/api";
import { useWaitingList } from "@/features/events/hooks/use-enrollment";
import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import type { EventResponse } from "@/lib/api";

interface CreateTeamPanelProps {
  event: EventResponse;
  onCreated?: () => void;
}

function isRegistrationDeadlinePassed(deadline: string): boolean {
  return Date.now() > new Date(`${deadline.split("T")[0]}T23:59:59`).getTime();
}

export function CreateTeamPanel({ event, onCreated }: CreateTeamPanelProps) {
  const qc = useQueryClient();
  const { data: config } = useSystemTeamConfig();
  const minTeamMembers = config?.minTeamMembers ?? 3;
  const { data: waitingList, isLoading: waitingLoading } = useWaitingList(event.id);
  const [teamName, setTeamName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createAndInvite, isPending } = useMutation({
    mutationFn: async () => {
      const name = teamName.trim();
      if (!name) throw new Error("Team name is required");

      const created = await teamApi.create(event.id, { name });
      const failed: string[] = [];

      for (const enrollment of waitingList ?? []) {
        if (!selectedIds.has(enrollment.userId)) continue;
        if (!enrollment.userEmail) continue;
        try {
          await invitationApi.send(created.id, { inviteeEmail: enrollment.userEmail });
        } catch {
          failed.push(enrollment.userEmail);
        }
      }

      return { created, failed };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: ["waiting-list", event.id] });
      qc.invalidateQueries({ queryKey: ["joinable-teams", event.id] });
      onCreated?.();
    },
  });

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await createAndInvite();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    }
  };

  const available = (waitingList ?? []).filter((e) => e.status === "APPROVED");
  const registrationClosed = event.registrationDeadline
    ? isRegistrationDeadlinePassed(event.registrationDeadline)
    : false;

  return (
    <div className="rounded-lg border border-seal-border bg-seal-surface p-6">
      <h2 className="text-lg font-semibold text-seal-text">Create your team</h2>
      <p className="mt-1 text-sm text-seal-text-muted">
        You are enrolled in <span className="font-medium text-seal-text">{event.name}</span>.
        Create a team and invite members from the waiting list.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-seal-text-secondary">Team name</label>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            maxLength={255}
            className="mt-1.5 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-seal-text-secondary">
            Invite from waiting list ({selectedIds.size} selected)
          </label>
          {waitingLoading ? (
            <p className="mt-2 text-sm text-seal-text-muted">Loading waiting list...</p>
          ) : available.length === 0 ? (
            <p className="mt-2 text-sm text-seal-text-muted">Waiting list trống — bạn có thể mời sau khi tạo team.</p>
          ) : (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-seal-border divide-y divide-seal-border-light">
              {available.map((e) => (
                <label
                  key={e.userId}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-seal-surface-sunken"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(e.userId)}
                    onChange={() => toggleMember(e.userId)}
                    className="rounded border-seal-border"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-seal-text">{e.userFullName || e.userEmail}</div>
                    <div className="truncate text-xs text-seal-text-muted">
                      {e.userEmail}
                      {e.userStudentId ? ` · ${e.userStudentId}` : ""}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <p className="mt-1 text-[11px] text-seal-text-muted">
            Team cần tối thiểu {minTeamMembers} thành viên (bao gồm bạn) trước khi chọn track.
          </p>
        </div>

        {registrationClosed && (
          <div className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">
            Registration deadline has passed. Team creation is no longer available.
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || !teamName.trim() || registrationClosed}
          className="rounded-lg bg-seal-cyan px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-seal-cyan-dark disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Invite"}
        </button>
      </div>
    </div>
  );
}
