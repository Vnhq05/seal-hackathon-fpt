"use client";

import type { Track } from "@/features/events/types/track-registration.types";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: 25,
  position: "relative",
  overflow: "hidden",
};

const pillBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.22px",
  lineHeight: "11px",
  padding: "5px 10px",
  borderRadius: 999,
};

const progressTrack: React.CSSProperties = {
  backgroundColor: "rgba(223,226,236,0.8)",
  height: 8,
  borderRadius: 999,
  overflow: "hidden",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#38bdf8",
  color: "#0e1528",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 4,
  padding: "10px 20px",
  border: "none",
  cursor: "pointer",
  letterSpacing: "0.24px",
  lineHeight: "12px",
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#8891a5",
  cursor: "not-allowed",
};

interface TrackCardProps {
  track: Track;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
}

export function TrackCard({ track, isSelected, onSelect }: TrackCardProps) {
  const isFull = track.status === "full";
  const capacityPercent = Math.round(
    (track.currentParticipants / track.maxParticipants) * 100,
  );

  return (
    <div
      style={{
        ...cardStyle,
        opacity: isFull ? 0.75 : 1,
        borderColor: isSelected ? "#38bdf8" : "rgba(223,226,236,0.8)",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(99, 102, 241, 0.2)"
          : "0px 1px 1px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left accent strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: isFull ? "#8891a5" : track.accentColor,
          borderRadius: "8px 0 0 8px",
        }}
      />

      <div className="flex flex-col gap-4" style={{ paddingLeft: 8 }}>
        {/* Header row: name + status pill */}
        <div className="flex items-center justify-between">
          <h3
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "28.8px",
            }}
          >
            {track.name}
          </h3>
          <span
            style={{
              ...pillBase,
              backgroundColor: isFull
                ? "rgba(156, 163, 175, 0.12)"
                : "rgba(16, 185, 129, 0.1)",
              color: isFull ? "#2dd4bf" : "#059669",
            }}
          >
            {isFull ? "Full" : "Open"}
          </span>
        </div>

        {/* Description */}
        {track.description && (
          <p
            style={{
              fontSize: 14,
              color: "#8891a5",
              lineHeight: "21px",
            }}
          >
            {track.description}
          </p>
        )}

        {/* Mentor */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center overflow-hidden rounded-full"
            style={{
              width: 28,
              height: 28,
              backgroundColor: "rgba(223,226,236,0.8)",
              flexShrink: 0,
            }}
          >
            {track.mentor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.mentor.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#8891a5",
                }}
              >
                {track.mentor.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#8891a5", lineHeight: "11px" }}>
              Mentor
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#0e1528",
                lineHeight: "18px",
              }}
            >
              {track.mentor.name}
            </p>
          </div>
        </div>

        {/* Capacity progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 12, color: "#8891a5" }}>
              {track.currentParticipants} / {track.maxParticipants} teams
            </span>
            <span style={{ fontSize: 12, color: "#8891a5" }}>
              {capacityPercent}%
            </span>
          </div>
          <div style={progressTrack}>
            <div
              style={{
                height: "100%",
                width: `${capacityPercent}%`,
                backgroundColor: isFull ? "#8891a5" : track.accentColor,
                borderRadius: 999,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Select button */}
        <button
          type="button"
          disabled={isFull}
          onClick={() => onSelect(track.id)}
          style={isFull ? disabledButtonStyle : buttonStyle}
        >
          {isSelected ? "Selected" : isFull ? "Track is full" : "Select this track"}
        </button>
      </div>
    </div>
  );
}
