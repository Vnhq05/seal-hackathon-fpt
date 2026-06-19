"use client";

import { useState } from "react";
import { useTrackRegistrationData } from "@/features/events/hooks/use-track-registration-data";
import { useRegisterTrack } from "@/features/events/hooks/use-register-track";
import { TrackCard } from "@/features/events/components/track-card";

const bgStyle: React.CSSProperties = { backgroundColor: "#eef0f6" };

const warningStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#b45309",
  backgroundColor: "rgba(245, 158, 11, 0.08)",
  border: "1px solid rgba(245, 158, 11, 0.2)",
  borderRadius: 6,
  padding: "10px 14px",
  textAlign: "center",
  lineHeight: "19.5px",
};

const footerStyle: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  backgroundColor: "#ffffff",
  borderTop: "1px solid rgba(223,226,236,0.8)",
  padding: "16px 24px",
  zIndex: 10,
};

const confirmButtonStyle: React.CSSProperties = {
  backgroundColor: "#38bdf8",
  color: "#0e1528",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 4,
  padding: "10px 24px",
  border: "none",
  cursor: "pointer",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

const confirmDisabledStyle: React.CSSProperties = {
  ...confirmButtonStyle,
  backgroundColor: "#8891a5",
  cursor: "not-allowed",
};

interface TrackRegistrationPageProps {
  hackathonId: string;
}

export function TrackRegistrationPage({
  hackathonId,
}: TrackRegistrationPageProps) {
  const { data, isLoading, isError } = useTrackRegistrationData(hackathonId);
  const { registerTrack, isPending } = useRegisterTrack(hackathonId);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={bgStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            Loading tracks...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={bgStyle}
      >
        <div className="flex flex-col items-center gap-4">
          <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>
            Unable to load tracks
          </p>
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            Could not load competition tracks. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const selectedTrack = data.tracks.find((t) => t.id === selectedTrackId);

  function handleConfirm() {
    if (!selectedTrackId || !data) return;
    registerTrack({
      hackathonId: data.hackathonId,
      teamId: data.teamId,
      trackId: selectedTrackId,
    });
  }

  return (
    <div className="flex min-h-screen flex-col" style={bgStyle}>
      {/* Header */}
      <div
        className="flex flex-col items-center"
        style={{ padding: "48px 24px 32px" }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.64px",
            lineHeight: "38.4px",
            textAlign: "center",
          }}
        >
          Choose your competition track
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#8891a5",
            lineHeight: "21px",
            marginTop: 8,
            textAlign: "center",
            maxWidth: 480,
          }}
        >
          Select the track that best matches your team&apos;s skills and
          interests for {data.hackathonName}.
        </p>
      </div>

      {/* Track cards */}
      <div
        className="mx-auto flex w-full flex-1 flex-col gap-4"
        style={{ maxWidth: 640, padding: "0 24px 120px" }}
      >
        {data.tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isSelected={selectedTrackId === track.id}
            onSelect={setSelectedTrackId}
          />
        ))}

        {/* Warning */}
        <div style={warningStyle}>
          This action cannot be undone. Once confirmed, your team will be locked
          into the selected track.
        </div>
      </div>

      {/* Sticky footer */}
      <div style={footerStyle}>
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: 640 }}
        >
          <div className="flex flex-col">
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#0e1528",
                lineHeight: "18px",
              }}
            >
              {data.teamName}
            </span>
            <span style={{ fontSize: 12, color: "#8891a5", lineHeight: "16px" }}>
              {selectedTrack ? selectedTrack.name : "No track selected"}
            </span>
          </div>
          <button
            type="button"
            disabled={!selectedTrackId || isPending}
            onClick={handleConfirm}
            style={!selectedTrackId || isPending ? confirmDisabledStyle : confirmButtonStyle}
          >
            {isPending ? "Confirming..." : "Confirm registration"}
          </button>
        </div>
      </div>
    </div>
  );
}
