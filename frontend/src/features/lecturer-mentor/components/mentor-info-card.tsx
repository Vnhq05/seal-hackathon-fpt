function VerifiedIcon() {
  return (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none" aria-hidden="true">
      <path d="M6.5 1L8 3.5L11 4L9 6.5L9.5 9.5L6.5 8.5L3.5 9.5L4 6.5L2 4L5 3.5L6.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

interface MentorInfoCardProps {
  name: string;
  avatarUrl: string | null;
  specialty: string;
}

export function MentorInfoCard({ name, avatarUrl, specialty }: MentorInfoCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center gap-4"
      style={{
        backdropFilter: "blur(5px)",
        backgroundColor: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(223,226,236,0.8)",
        borderRadius: 8,
        padding: 25,
        height: 114,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -64,
          right: -64,
          width: 128,
          height: 128,
          borderRadius: 9999,
          backgroundColor: "rgba(99,102,241,0.05)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{
          width: 64,
          height: 64,
          border: "2px solid #ffffff",
          boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
          backgroundColor: "#dcfce7",
          position: "relative",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 700, color: "#0ea5e9" }}>{initial}</span>
        )}
      </div>
      <div className="relative flex flex-col gap-1">
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.6px",
          textTransform: "uppercase" as const,
          lineHeight: "12px",
        }}>
          ASSIGNED MENTOR
        </span>
        <span style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#0e1528",
          lineHeight: "25.2px",
        }}>
          {name}
        </span>
        <span className="flex items-center gap-1" style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}>
          <VerifiedIcon />
          {specialty}
        </span>
      </div>
    </div>
  );
}
