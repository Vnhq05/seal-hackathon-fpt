interface TeamTrackBadgeProps {
  trackName: string;
}

export function TeamTrackBadge({ trackName }: TeamTrackBadgeProps) {
  return (
    <span
      className="rounded-md"
      style={{
        backgroundColor: "rgba(223,226,236,0.8)",
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#8891a5",
        lineHeight: "16.5px",
      }}
    >
      {trackName}
    </span>
  );
}
