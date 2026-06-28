"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { trackApi } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { finalistApi } from "@/lib/api/finalist.api";
import { awardApi } from "@/lib/api/award.api";
import { SealCard } from "@/shared/ui/seal-card";
import { SealButton } from "@/shared/ui/seal-button";

export function CoordinatorTrackAssignmentPage() {
  const qc = useQueryClient();
  const [eventId, setEventId] = useState<string>("");

  const { data: events } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ size: 20 }).then((p) => p.content),
  });

  const { data: tracks } = useQuery({
    queryKey: ["tracks", eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams", eventId],
    queryFn: () => teamApi.list(eventId, { size: 100 }).then((p) => p.content),
    enabled: !!eventId,
  });

  const drawMutation = useMutation({
    mutationFn: () => trackAssignmentApi.draw(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
    },
  });

  const finalistMutation = useMutation({
    mutationFn: () => finalistApi.select(eventId),
  });

  const awardMutation = useMutation({
    mutationFn: () => awardApi.assign(eventId),
  });

  const sealEvents = events?.filter((e) => e.competitionFormat === "SEAL_RAG_2026") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Track & Finals Management</h1>
        <p className="text-sm text-seal-text-secondary">
          Bốc thăm chia bảng, chọn Top 6 và trao giải cho SEAL Hackathon.
        </p>
      </div>

      <SealCard className="p-4">
        <label className="text-xs font-semibold uppercase text-seal-text-muted">Chọn sự kiện</label>
        <select
          className="mt-2 w-full border-2 border-navy px-3 py-2 font-mono text-sm"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">— Chọn event —</option>
          {(sealEvents.length > 0 ? sealEvents : events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.competitionFormat === "SEAL_RAG_2026" ? "(SEAL)" : ""}
            </option>
          ))}
        </select>
      </SealCard>

      {eventId && (
        <>
          <SealCard className="p-4 space-y-4">
            <h2 className="font-mono font-bold text-navy">Bốc thăm chia bảng</h2>
            <p className="text-sm text-seal-text-secondary">
              {teams?.filter((t) => !t.trackId).length ?? 0} đội chưa có bảng · {tracks?.length ?? 0} bảng
            </p>
            <SealButton
              onClick={() => drawMutation.mutate()}
              disabled={drawMutation.isPending}
            >
              {drawMutation.isPending ? "Đang bốc thăm..." : "Bốc thăm ngẫu nhiên"}
            </SealButton>
            {drawMutation.data && (
              <p className="text-sm text-emerald-700">
                Đã gán {drawMutation.data.assignments.length} đội · Còn {drawMutation.data.unassignedCount} chưa gán
              </p>
            )}
          </SealCard>

          <SealCard className="p-4 space-y-4">
            <h2 className="font-mono font-bold text-navy">Chọn Top 6 (Chung kết)</h2>
            <SealButton onClick={() => finalistMutation.mutate()} disabled={finalistMutation.isPending}>
              {finalistMutation.isPending ? "Đang chọn..." : "Chọn finalist (Top 2/bảng)"}
            </SealButton>
            {finalistMutation.data && (
              <ul className="space-y-1 text-sm">
                {finalistMutation.data.map((f) => (
                  <li key={f.id}>
                    #{f.preliminaryRank} {f.teamName} — {f.trackName}
                  </li>
                ))}
              </ul>
            )}
          </SealCard>

          <SealCard className="p-4 space-y-4">
            <h2 className="font-mono font-bold text-navy">Trao giải</h2>
            <SealButton onClick={() => awardMutation.mutate()} disabled={awardMutation.isPending}>
              {awardMutation.isPending ? "Đang gán..." : "Gán giải từ BXH chung kết"}
            </SealButton>
            {awardMutation.data && (
              <ul className="space-y-1 text-sm">
                {awardMutation.data.map((a) => (
                  <li key={a.id}>
                    {a.prizeLabel}: {a.teamName}
                  </li>
                ))}
              </ul>
            )}
          </SealCard>
        </>
      )}
    </div>
  );
}
