const cardBase: React.CSSProperties = {
  backdropFilter: "blur(5px)",
  backgroundColor: "rgba(255,255,255,0.95)",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "33px 17px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  textTransform: "uppercase" as const,
  lineHeight: "12px",
  paddingBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
  color: "#0e1528",
  letterSpacing: "-0.24px",
  lineHeight: "31.2px",
};

interface MentorTrackStatsRowProps {
  maxTeams: number;
  registeredTeams: number;
  currentRound: string;
  submissionCount: number;
  totalTeams: number;
}

export function MentorTrackStatsRow({
  maxTeams,
  registeredTeams,
  currentRound,
  submissionCount,
  totalTeams,
}: MentorTrackStatsRowProps) {
  const registeredPercent = maxTeams > 0 ? (registeredTeams / maxTeams) * 100 : 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div style={cardBase}>
        <p style={labelStyle}>MAX TEAMS</p>
        <p style={valueStyle}>{maxTeams}</p>
      </div>

      <div style={{ ...cardBase, padding: "27px 17px" }}>
        <p style={labelStyle}>REGISTERED</p>
        <p style={valueStyle}>{registeredTeams}</p>
        <div style={{ marginTop: 8 }}>
          <div style={{
            width: "100%",
            height: 4,
            backgroundColor: "rgba(223,226,236,0.8)",
            borderRadius: 9999,
          }}>
            <div style={{
              width: `${registeredPercent}%`,
              height: 4,
              backgroundColor: "#38bdf8",
              borderRadius: 9999,
            }} />
          </div>
        </div>
      </div>

      <div style={{
        ...cardBase,
        borderLeft: "4px solid #38bdf8",
        paddingLeft: 20,
      }}>
        <p style={labelStyle}>CURRENT ROUND</p>
        <p style={valueStyle}>{currentRound}</p>
      </div>

      <div style={cardBase}>
        <p style={labelStyle}>SUBMISSIONS</p>
        <div className="flex items-end gap-2">
          <span style={valueStyle}>{submissionCount}</span>
          <span style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#8891a5",
            lineHeight: "21px",
            paddingBottom: 4,
          }}>
            /{totalTeams}
          </span>
        </div>
      </div>
    </div>
  );
}
