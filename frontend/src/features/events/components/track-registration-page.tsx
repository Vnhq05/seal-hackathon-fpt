"use client";

import { useTrackRegistrationData } from "@/features/events/hooks/use-track-registration-data";

const bgStyle: React.CSSProperties = { backgroundColor: "#eef0f6" };

interface TrackRegistrationPageProps {
  hackathonId: string;
}

export function TrackRegistrationPage({ hackathonId }: TrackRegistrationPageProps) {
  const { data, isLoading, isError } = useTrackRegistrationData(hackathonId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={bgStyle}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={bgStyle}>
        <p className="text-sm text-seal-text-muted">Unable to load track information.</p>
      </div>
    );
  }

  const assignedTrack = data.tracks.find((t) => t.id === data.assignedTrackId);
  const isSeal = data.competitionFormat === "SEAL_RAG_2026";

  return (
    <div className="flex min-h-screen flex-col" style={bgStyle}>
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="text-center text-2xl font-bold text-navy">
          {isSeal ? "Bảng thi của đội" : "Competition Track"}
        </h1>
        <p className="mt-2 text-center text-sm text-seal-text-secondary">
          {isSeal
            ? "BTC phân bảng và bốc thăm chủ đề. Bạn không tự chọn bảng."
            : `Track assignment for ${data.hackathonName}`}
        </p>

        <div className="mt-8 border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
          <p className="text-xs uppercase tracking-wider text-seal-text-muted">Team</p>
          <p className="mt-1 font-semibold text-navy">{data.teamName || "—"}</p>

          {assignedTrack ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-seal-text-muted">Assigned track</p>
              <p className="mt-1 text-lg font-bold text-royal">{assignedTrack.name}</p>
              {assignedTrack.topic && (
                <p className="mt-2 text-sm text-navy">
                  <span className="font-semibold">Chủ đề:</span> {assignedTrack.topic}
                </p>
              )}
              {assignedTrack.description && (
                <p className="mt-2 text-sm text-seal-text-secondary">{assignedTrack.description}</p>
              )}
            </div>
          ) : (
            <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {isSeal
                ? "Đội chưa được BTC phân bảng. Vui lòng chờ lễ bốc thăm."
                : "No track assigned yet."}
            </p>
          )}
        </div>

        {!assignedTrack && data.tracks.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase text-seal-text-muted">Các bảng trong cuộc thi</p>
            {data.tracks.map((track) => (
              <div key={track.id} className="border border-navy/20 bg-white p-4">
                <p className="font-semibold text-navy">{track.name}</p>
                {track.topic && <p className="text-sm text-seal-text-secondary">{track.topic}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
