"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi, invitationApi } from "@/lib/api";
import { useWaitingList, enrollmentWaitingListKey } from "@/features/events/hooks/use-enrollment";
import { useEventParticipationGate } from "@/features/events/hooks/use-event-participation-gate";
import { resolveEventTeamSize } from "@/features/events/utils/participation-gate.utils";
import { useSystemTeamConfig } from "@/features/teams/hooks/use-system-team-config";
import type { EventResponse } from "@/lib/api";
import { HACKATHON_SKILL_ROLE_LABELS } from "@/lib/api/types";
import { JOINABLE_TEAMS_KEY } from "@/features/teams/hooks/use-joinable-teams";

interface CreateTeamPanelProps {
  event: EventResponse;
  onCreated?: () => void;
}

export function CreateTeamPanel({ event, onCreated }: CreateTeamPanelProps) {
  const qc = useQueryClient();
  const { data: config } = useSystemTeamConfig();
  const { minTeam: minTeamMembers } = resolveEventTeamSize(
    event,
    config?.minTeamMembers ?? 3,
    config?.maxTeamMembers ?? 5,
  );
  const { canModifyMembers, registrationClosedReason } = useEventParticipationGate(event);
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
      qc.invalidateQueries({ queryKey: enrollmentWaitingListKey(event.id) });
      qc.invalidateQueries({ queryKey: [JOINABLE_TEAMS_KEY, event.id] });
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
  const registrationClosed = !canModifyMembers;

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6">
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
            className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm text-seal-text outline-none focus:border-royal/40"
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
            <div className="mt-2 max-h-48 overflow-y-auto border-2 border-navy bg-white divide-y divide-navy/10 shadow-[2px_2px_0_0_#0c1228]">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm text-seal-text">{e.userFullName || e.userEmail}</div>
                      {e.isLookingForTeam && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Looking for team
                        </span>
                      )}
                      {e.preferredRole && (
                        <span className="rounded-md bg-seal-cyan/10 px-2 py-0.5 text-[10px] font-medium text-seal-cyan">
                          {HACKATHON_SKILL_ROLE_LABELS[e.preferredRole]}
                        </span>
                      )}
                    </div>
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
            {registrationClosedReason ?? "Registration is closed. Team changes are no longer available."}
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending || !teamName.trim() || registrationClosed}
          className="border-2 border-navy bg-seal-yellow px-4 py-2.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Invite"}
        </button>
      </div>
    </div>
  );
}
