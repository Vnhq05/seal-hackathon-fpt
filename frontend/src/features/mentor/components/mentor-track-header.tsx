"use client";

// TODO: backend endpoint not implemented yet — /mentor/teams/export does not exist.
// Export button is kept but uses a placeholder that does nothing.

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5V8.5M6 8.5L3 5.5M6 8.5L9 5.5M1.5 10.5H10.5" stroke="#eef0f6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const badgeStyle: React.CSSProperties = {
  backgroundColor: "rgba(99,102,241,0.1)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: 9999,
  padding: "3px 9px",
  fontSize: 10,
  fontWeight: 700,
  color: "#38bdf8",
  textTransform: "uppercase",
  lineHeight: "15px",
};

const exportBtnStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "9px 17px",
  fontSize: 12,
  fontWeight: 500,
  color: "#0e1528",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  cursor: "pointer",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
  whiteSpace: "nowrap" as const,
};

interface MentorTrackHeaderProps {
  hackathonName: string;
  trackName: string;
  description: string;
  trackId: string;
}

export function MentorTrackHeader({
  hackathonName,
  trackName,
  description,
  trackId,
}: MentorTrackHeaderProps) {
  const handleExport = () => {
    // TODO: backend endpoint not implemented yet — no CSV export available
    console.warn("Export CSV: backend endpoint not implemented yet for track", trackId);
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#38bdf8",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            lineHeight: "12px",
          }}>
            {hackathonName}
          </span>
          <span style={badgeStyle}>YOU ARE THE MENTOR FOR THIS TRACK</span>
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#0e1528",
          letterSpacing: "-0.64px",
          lineHeight: "38.4px",
        }}>
          {trackName}
        </h1>
        <p style={{
          fontSize: 14,
          fontWeight: 400,
          color: "#8891a5",
          lineHeight: "21px",
          maxWidth: 672,
          marginTop: 5,
        }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={handleExport}
        className="flex items-center gap-1"
        style={exportBtnStyle}
      >
        <DownloadIcon />
        Export Data
      </button>
    </div>
  );
}
