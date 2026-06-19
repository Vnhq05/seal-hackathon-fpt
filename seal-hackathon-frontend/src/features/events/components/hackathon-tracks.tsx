import type { HackathonTrack } from "@/features/events/types/hackathon-detail.types";

interface HackathonTracksProps {
  tracks: HackathonTrack[];
}

function TrackCard({ track }: { track: HackathonTrack }) {
  return (
    <div
      className="flex flex-col rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: track.isUserTrack
          ? "1px solid transparent"
          : "1px solid rgba(223,226,236,0.8)",
        padding: 17,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
        boxShadow: track.isUserTrack
          ? "0px 0px 0px 2px black, 0px 1px 2px 0px rgba(0,0,0,0.05)"
          : undefined,
      }}
    >
      <div style={{ paddingBottom: 8 }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            backgroundColor: track.iconBgColor,
          }}
        >
          {track.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.iconUrl} alt="" style={{ width: 18, height: 18 }} />
          ) : (
            <span style={{ fontSize: 18 }}>📦</span>
          )}
        </div>
      </div>

      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#0e1528",
          lineHeight: "25.2px",
          paddingBottom: 4,
        }}
      >
        {track.name}
      </h3>

      <p
        style={{
          fontSize: 14,
          color: "#8891a5",
          lineHeight: "21px",
          paddingBottom: 16,
        }}
      >
        {track.description}
      </p>

      <div
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(198,198,205,0.5)", paddingTop: 9 }}
      >
        <div className="flex items-start">
          {track.mentors.slice(0, 3).map((mentor, i) => (
            <div
              key={mentor.id}
              className="overflow-hidden rounded-full"
              style={{
                width: 24,
                height: 24,
                border: "2px solid white",
                marginRight: i < track.mentors.length - 1 ? -8 : 0,
                backgroundColor: "rgba(223,226,236,0.8)",
                zIndex: track.mentors.length - i,
              }}
            >
              {mentor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mentor.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ fontSize: 9, fontWeight: 700, color: "#0ea5e9" }}
                >
                  {mentor.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>

        <span
          className="rounded"
          style={{
            backgroundColor: track.isUserTrack ? "#dcfce7" : "rgba(223,226,236,0.8)",
            padding: "2px 4px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: track.isUserTrack ? "#000000" : "#8891a5",
            lineHeight: "19.5px",
          }}
        >
          {track.isUserTrack ? "Your Track" : `${track.teamCount} Teams`}
        </span>
      </div>
    </div>
  );
}

export function HackathonTracks({ tracks }: HackathonTracksProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="#0e1528" strokeWidth="1.5" />
          <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="#0e1528" strokeWidth="1.5" />
          <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="#0e1528" strokeWidth="1.5" />
          <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="#0e1528" strokeWidth="1.5" />
        </svg>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#0e1528",
            letterSpacing: "-0.24px",
            lineHeight: "31.2px",
          }}
        >
          Competition Tracks
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}
