interface MentorScoreDisplayProps {
  score: number;
  maxScore: number;
}

export function MentorScoreDisplay({ score, maxScore }: MentorScoreDisplayProps) {
  const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg"
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid #0b1715",
        padding: 17,
        width: 192,
        flexShrink: 0,
        alignSelf: "stretch",
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px", paddingBottom: 4 }}>
        Aggregate Score
      </p>
      <div className="flex items-baseline gap-1">
        <span style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", lineHeight: "40px" }}>
          {score}
        </span>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#8891a5", lineHeight: "21px" }}>
          /{maxScore}
        </span>
      </div>
      <div style={{ width: "100%", marginTop: 8 }}>
        <div style={{ width: "100%", height: 8, backgroundColor: "rgba(124,131,155,0.2)", borderRadius: 9999 }}>
          <div style={{ width: `${percent}%`, height: 8, backgroundColor: "#38bdf8", borderRadius: 9999 }} />
        </div>
      </div>
    </div>
  );
}
