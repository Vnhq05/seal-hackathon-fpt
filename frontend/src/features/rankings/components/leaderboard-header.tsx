interface LeaderboardHeaderProps {
  hackathonName: string;
  subtitle: string;
  onDownloadCsv: () => void;
  isDownloading: boolean;
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  color: "#0e1528",
  letterSpacing: "-0.64px",
  lineHeight: "38.4px",
  fontFamily: "Inter, sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: "#8891a5",
  lineHeight: "21px",
  marginTop: 4,
};

const downloadBtnStyle: React.CSSProperties = {
  backgroundColor: "#dcfce7",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 4,
  padding: "9px 17px",
  fontSize: 12,
  fontWeight: 500,
  color: "#0e1528",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function DownloadIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 1.5V8.5M6 8.5L3 5.5M6 8.5L9 5.5M1.5 10.5H10.5"
        stroke="#0e1528"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LeaderboardHeader({
  hackathonName,
  subtitle,
  onDownloadCsv,
  isDownloading,
}: LeaderboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 style={titleStyle}>{hackathonName} Rankings</h1>
        <p style={subtitleStyle}>{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onDownloadCsv}
        disabled={isDownloading}
        className="flex items-center gap-2"
        style={{
          ...downloadBtnStyle,
          opacity: isDownloading ? 0.6 : 1,
        }}
      >
        <DownloadIcon />
        Download ranking CSV
      </button>
    </div>
  );
}
