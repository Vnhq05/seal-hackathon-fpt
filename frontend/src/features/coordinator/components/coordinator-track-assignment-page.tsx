"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { trackApi, type TrackResponse } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { formatContestedSlotType, formatSelectionMethod } from "@/lib/api/finalist.utils";
import { EventPhasePanel } from "@/features/events/components/event-phase-panel";
import { useAssignAwards } from "@/features/coordinator/hooks/use-awards";
import { useTrackDrawSession } from "@/features/coordinator/hooks/use-track-draw-session";
import {
  useContestedFinalistSlots,
  useFinalists,
  useSelectFinalists,
} from "@/features/coordinator/hooks/use-finalists";
import { SealCard } from "@/shared/ui/seal-card";
import { SealButton } from "@/shared/ui/seal-button";

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 16).replace("T", " ");
}

function SealDrawSessionPanel({
  eventId,
  teams,
  tracks,
}: {
  eventId: string;
  teams: { id: string; name: string; trackId: string | null }[];
  tracks: TrackResponse[];
}) {
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string>>({});
  const {
    session,
    isLoadingSession,
    openSession,
    isOpening,
    openError,
    lockTracks,
    isLocking,
    lockResult,
    assignTopic,
    isAssigningTopic,
  } = useTrackDrawSession(eventId, true);

  const unassignedCount = teams.filter((t) => !t.trackId).length;
  const allAssigned = unassignedCount === 0 && teams.length > 0;
  const allHaveTopic = tracks.every((t) => t.topic);
  const allLocked = tracks.every((t) => t.status === "LOCKED");

  const handleOpenSession = () => {
    const unassigned = teams.filter((t) => !t.trackId);
    openSession({
      drawOrder: unassigned.length > 0 ? unassigned.map((t) => t.id) : undefined,
    });
  };

  return (
    <SealCard className="space-y-4 p-4">
      <h2 className="font-mono font-bold text-navy">Phiên bốc thăm chia bảng (SEAL)</h2>
      <p className="text-sm text-seal-text-secondary">
        {unassignedCount} đội chưa có bảng · {tracks.length} bảng · Đội tự chọn theo lượt
      </p>

      {isLoadingSession && !session && (
        <p className="text-sm text-seal-text-muted">Đang tải phiên bốc thăm...</p>
      )}

      {!session && !isLoadingSession && (
        <SealButton onClick={handleOpenSession} disabled={isOpening || unassignedCount === 0}>
          {isOpening ? "Đang mở phiên..." : "Mở phiên bốc thăm"}
        </SealButton>
      )}

      {openError && (
        <p className="text-sm text-red-600">{(openError as Error).message}</p>
      )}

      {session && (
        <div className="space-y-3 rounded border border-navy/20 bg-navy/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                session.status === "OPEN"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {session.status === "OPEN" ? "Đang diễn ra" : "Đã đóng"}
            </span>
            <span className="text-sm text-seal-text-secondary">
              Lượt {session.currentIndex + 1}/{session.totalTeams}
            </span>
          </div>

          {session.status === "OPEN" && session.currentTeamName && (
            <p className="text-sm font-semibold text-navy">
              Lượt hiện tại: {session.currentTeamName}
            </p>
          )}

          {session.openedAt && (
            <p className="text-xs text-seal-text-muted">Mở lúc: {formatDt(session.openedAt)}</p>
          )}

          {session.availableTracks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-seal-text-muted">
                Bảng còn chỗ
              </p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {session.availableTracks.map((slot) => (
                  <li
                    key={slot.trackId}
                    className="border border-navy/20 bg-white px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{slot.name}</span>
                    <span className="ml-2 text-seal-text-muted">({slot.remainingSlots} chỗ)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-navy">Gán chủ đề cho từng bảng</h3>
          {tracks.map((track) => (
            <div key={track.id} className="flex flex-wrap items-end gap-2 border border-navy/10 p-3">
              <div className="min-w-[120px] flex-1">
                <p className="text-xs uppercase text-seal-text-muted">{track.name}</p>
                <p className="text-xs text-seal-text-secondary">
                  {track.assignedTeamCount ?? 0} đội
                  {track.status === "LOCKED" && " · Đã khóa"}
                </p>
                {track.topic && (
                  <p className="mt-1 text-sm text-navy">
                    <span className="font-semibold">Chủ đề:</span> {track.topic}
                  </p>
                )}
              </div>
              {!track.topic && track.status !== "LOCKED" && (
                <>
                  <input
                    type="text"
                    placeholder="Nhập chủ đề bảng..."
                    className="min-w-[200px] flex-1 border-2 border-navy px-2 py-1.5 text-sm"
                    value={topicDrafts[track.id] ?? ""}
                    onChange={(e) =>
                      setTopicDrafts((prev) => ({ ...prev, [track.id]: e.target.value }))
                    }
                  />
                  <SealButton
                    onClick={() => {
                      const topic = topicDrafts[track.id]?.trim();
                      if (topic) assignTopic({ trackId: track.id, topic });
                    }}
                    disabled={isAssigningTopic || !topicDrafts[track.id]?.trim()}
                  >
                    Gán chủ đề
                  </SealButton>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {allAssigned && allHaveTopic && !allLocked && (
        <SealButton onClick={() => lockTracks()} disabled={isLocking}>
          {isLocking ? "Đang khóa..." : "Khóa tất cả bảng (kết thúc Day 1)"}
        </SealButton>
      )}

      {lockResult && (
        <p className="text-sm text-emerald-700">
          Đã khóa {lockResult.lockedTrackCount} bảng.
        </p>
      )}

      {allLocked && (
        <p className="text-sm font-semibold text-emerald-700">
          Tất cả bảng đã khóa. Không thể thay đổi phân bảng.
        </p>
      )}
    </SealCard>
  );
}

function GenericDrawPanel({
  eventId,
  unassignedCount,
}: {
  eventId: string;
  unassignedCount: number;
}) {
  const qc = useQueryClient();
  const drawMutation = useMutation({
    mutationFn: () => trackAssignmentApi.draw(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
    },
  });

  return (
    <SealCard className="space-y-4 p-4">
      <h2 className="font-mono font-bold text-navy">Bốc thăm chia bảng</h2>
      <p className="text-sm text-seal-text-secondary">{unassignedCount} đội chưa có bảng</p>
      <SealButton onClick={() => drawMutation.mutate()} disabled={drawMutation.isPending}>
        {drawMutation.isPending ? "Đang bốc thăm..." : "Bốc thăm ngẫu nhiên"}
      </SealButton>
      {drawMutation.data && (
        <p className="text-sm text-emerald-700">
          Đã gán {drawMutation.data.assignments.length} đội · Còn{" "}
          {drawMutation.data.unassignedCount} chưa gán
        </p>
      )}
    </SealCard>
  );
}

export function CoordinatorTrackAssignmentPage() {
  const [eventId, setEventId] = useState<string>("");

  const { data: events } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ size: 20 }).then((p) => p.content),
  });

  const selectedEvent = events?.find((e) => e.id === eventId);
  const isSeal = selectedEvent?.competitionFormat === "SEAL_RAG_2026";

  const { data: tracks } = useQuery({
    queryKey: ["tracks", eventId],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
    refetchInterval: isSeal ? 4000 : false,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams", eventId],
    queryFn: () => teamApi.list(eventId, { size: 100 }).then((p) => p.content),
    enabled: !!eventId,
    refetchInterval: isSeal ? 4000 : false,
  });

  const finalistMutation = useSelectFinalists(eventId || undefined);
  const { data: finalists = [] } = useFinalists(eventId || undefined, !!eventId);
  const { data: contestedSlots = [] } = useContestedFinalistSlots(eventId || undefined, !!eventId);

  const awardMutation = useAssignAwards(eventId || undefined);

  const sealEvents = events?.filter((e) => e.competitionFormat === "SEAL_RAG_2026") ?? [];
  const unassignedCount = teams?.filter((t) => !t.trackId).length ?? 0;

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

      {eventId && selectedEvent && (
        <EventPhasePanel eventId={eventId} currentStatus={selectedEvent.status} />
      )}

      {eventId && (
        <>
          {isSeal && teams && tracks ? (
            <SealDrawSessionPanel eventId={eventId} teams={teams} tracks={tracks} />
          ) : (
            <GenericDrawPanel eventId={eventId} unassignedCount={unassignedCount} />
          )}

          <SealCard className="space-y-4 p-4">
            <h2 className="font-mono font-bold text-navy">Chọn Top 6 (Chung kết)</h2>
            <SealButton onClick={() => finalistMutation.mutate()} disabled={finalistMutation.isPending}>
              {finalistMutation.isPending ? "Đang chọn..." : "Chọn finalist (Top 2/bảng)"}
            </SealButton>
            {finalistMutation.data?.summary && (
              <p className="text-sm text-seal-text-secondary">
                Đã chọn {finalistMutation.data.summary.selectedCount}/{finalistMutation.data.summary.targetCount} đội
                {finalistMutation.data.summary.penaltyEvaluationRequired && (
                  <span className="ml-2 font-semibold text-amber-700">— Cần OC đánh giá penalty</span>
                )}
              </p>
            )}
            {(finalists.length > 0 || finalistMutation.data?.finalists) && (
              <ul className="space-y-1 text-sm">
                {(finalistMutation.data?.finalists ?? finalists).map((f) => (
                  <li key={f.id}>
                    #{f.preliminaryRank} {f.teamName} — {f.trackName ?? "—"}
                    {f.selectionMethod && (
                      <span className="ml-1 text-seal-text-muted">
                        ({formatSelectionMethod(f.selectionMethod)})
                      </span>
                    )}
                    {f.needsPenaltyEvaluation && (
                      <span className="ml-1 text-amber-700">(penalty pending)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {contestedSlots.length > 0 && (
              <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm">
                <p className="font-semibold text-amber-900">Vị trí tranh chấp — cần OC penalty evaluation</p>
                <ul className="mt-2 space-y-2">
                  {contestedSlots.map((slot) => (
                    <li key={slot.id}>
                      {slot.trackName ?? "Overflow"} ({formatContestedSlotType(slot.slotType)}):{" "}
                      {slot.teams.map((t) => t.teamName).join(" vs ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SealCard>

          <SealCard className="space-y-4 p-4">
            <h2 className="font-mono font-bold text-navy">Trao giải</h2>
            <SealButton onClick={() => awardMutation.mutate()} disabled={awardMutation.isPending}>
              {awardMutation.isPending ? "Đang gán..." : "Gán giải từ BXH chung kết"}
            </SealButton>
            {awardMutation.isError && (
              <p className="text-sm text-red-600">
                {awardMutation.error instanceof Error
                  ? awardMutation.error.message
                  : "Không thể gán giải. Vui lòng thử lại."}
              </p>
            )}
            {awardMutation.data && (
              <div className="space-y-2 text-sm">
                <ul className="space-y-1">
                  {awardMutation.data.teamAwards.map((a) => (
                    <li key={a.id}>
                      {a.prizeLabel}: {a.teamName}
                    </li>
                  ))}
                </ul>
                <p className="text-seal-text-secondary">
                  Đã cấp {awardMutation.data.participationCertificatesIssued} chứng nhận tham gia.
                </p>
              </div>
            )}
          </SealCard>
        </>
      )}
    </div>
  );
}
