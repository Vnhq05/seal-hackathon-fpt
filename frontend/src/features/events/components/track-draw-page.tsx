"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { trackApi } from "@/lib/api/track.api";
import { teamApi } from "@/lib/api/team.api";

const POLL_INTERVAL_MS = 3000;

export function TrackDrawPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data: memberships, isLoading: teamsLoading } = useMyTeamsAllEvents();

  const active = memberships?.find((m) => m.team && m.event.competitionFormat === "SEAL_RAG_2026");
  const event = active?.event ?? null;
  const team = active?.team ?? null;
  const isLeader = team?.leaderId === user?.id;

  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ["draw-session", event?.id],
    queryFn: () => trackAssignmentApi.getDrawSession(event!.id),
    enabled: !!event?.id,
    refetchInterval: (query) =>
      query.state.data?.status === "OPEN" ? POLL_INTERVAL_MS : false,
    retry: false,
  });

  const { data: tracks } = useQuery({
    queryKey: ["tracks", event?.id],
    queryFn: () => trackApi.list(event!.id),
    enabled: !!event?.id,
    refetchInterval: session?.status === "OPEN" ? POLL_INTERVAL_MS : false,
  });

  const assignedTrack = tracks?.find((t) => t.id === team?.trackId);

  const { mutate: selfDraw, isPending: drawing, error: drawError } = useMutation({
    mutationFn: (trackId: string) =>
      teamApi.selfDrawTrack(event!.id, team!.id, { trackId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draw-session", event?.id] });
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      qc.invalidateQueries({ queryKey: ["tracks", event?.id] });
    },
  });

  if (teamsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
      </div>
    );
  }

  if (!event || !team) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-navy">Bảng thi</h1>
        <p className="mt-4 text-sm text-seal-text-secondary">
          Bạn chưa tham gia team trong sự kiện SEAL Spring 2026.
        </p>
        <Link href="/student/teams" className="mt-4 inline-block text-sm font-semibold text-royal underline">
          Quay lại Teams
        </Link>
      </div>
    );
  }

  const noSession = sessionError && !session;
  const isMyTurn =
    session?.status === "OPEN" &&
    isLeader &&
    session.currentTeamId === team.id;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Bảng thi</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          {event.name} — BTC tổ chức phiên bốc thăm, đội tự chọn bảng theo lượt.
        </p>
      </div>

      <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
        <p className="text-xs uppercase tracking-wider text-seal-text-muted">Team</p>
        <p className="mt-1 font-semibold text-navy">{team.name}</p>
        {!isLeader && (
          <p className="mt-2 text-xs text-amber-700">
            Chỉ Leader mới được chọn bảng khi đến lượt.
          </p>
        )}
      </div>

      {assignedTrack ? (
        <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
          <p className="text-xs uppercase tracking-wider text-seal-text-muted">Bảng đã chọn</p>
          <p className="mt-1 text-lg font-bold text-royal">{assignedTrack.name}</p>
          {assignedTrack.topic && (
            <p className="mt-2 text-sm text-navy">
              <span className="font-semibold">Chủ đề:</span> {assignedTrack.topic}
            </p>
          )}
          {assignedTrack.status === "LOCKED" && (
            <p className="mt-3 text-xs font-semibold text-emerald-700">
              Bảng đã khóa — không thể thay đổi.
            </p>
          )}
        </div>
      ) : sessionLoading ? (
        <p className="text-sm text-seal-text-muted">Đang tải phiên bốc thăm...</p>
      ) : noSession ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Phiên bốc thăm chưa mở. Vui lòng chờ BTC bắt đầu lễ bốc thăm (Day 1).
        </div>
      ) : session?.status === "CLOSED" ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Phiên bốc thăm đã kết thúc. Liên hệ BTC nếu đội chưa có bảng.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Phiên đang diễn ra — Lượt {session!.currentIndex + 1}/{session!.totalTeams}
            </p>
            {session!.currentTeamName && (
              <p className="mt-1 text-sm text-blue-800">
                {isMyTurn
                  ? "Đến lượt đội bạn! Chọn một bảng bên dưới."
                  : `Đang chờ: ${session!.currentTeamName}`}
              </p>
            )}
          </div>

          {isMyTurn && session!.availableTracks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-seal-text-muted">
                Chọn bảng (còn chỗ)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {session!.availableTracks.map((slot) => (
                  <button
                    key={slot.trackId}
                    type="button"
                    disabled={drawing}
                    onClick={() => selfDraw(slot.trackId)}
                    className="border-2 border-navy bg-seal-yellow px-4 py-3 text-left font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] transition hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {slot.name}
                    <span className="mt-1 block text-xs font-normal text-navy/70">
                      Còn {slot.remainingSlots} chỗ
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {drawError && (
            <p className="text-sm text-red-600">{(drawError as Error).message}</p>
          )}
        </div>
      )}

      {tracks && tracks.length > 0 && !assignedTrack && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-seal-text-muted">
            Các bảng trong cuộc thi
          </p>
          {tracks.map((track) => (
            <div key={track.id} className="border border-navy/20 bg-white p-3 text-sm">
              <span className="font-semibold text-navy">{track.name}</span>
              {track.topic && (
                <span className="ml-2 text-seal-text-secondary">— {track.topic}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
