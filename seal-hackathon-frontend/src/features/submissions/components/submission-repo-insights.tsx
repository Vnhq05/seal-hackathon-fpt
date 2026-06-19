import type { RepoInsights } from "@/features/submissions/types/submission-detail.types";

interface SubmissionRepoInsightsProps {
  insights: RepoInsights;
}

const monoLabel: React.CSSProperties = {
  fontSize: 13,
  color: "#8891a5",
  fontFamily: "monospace",
  lineHeight: "19.5px",
};

const monoValue: React.CSSProperties = {
  fontSize: 13,
  color: "#0e1528",
  fontFamily: "monospace",
  lineHeight: "19.5px",
};

export function SubmissionRepoInsights({ insights }: SubmissionRepoInsightsProps) {
  return (
    <div
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid rgba(223,226,236,0.8)",
        borderRadius: 8,
        padding: 25,
      }}
    >
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#8891a5",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
          }}
        >
          Repository Insights
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div
          className="flex flex-col items-center rounded py-2"
          style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)" }}
        >
          <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
            <circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 5h2" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="10" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 5h2" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="16" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0e1528",
              letterSpacing: "-0.24px",
              lineHeight: "31.2px",
              marginTop: 4,
            }}
          >
            {insights.commits}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
            }}
          >
            Commits
          </span>
        </div>

        <div
          className="flex flex-col items-center rounded py-2"
          style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)" }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path
              d="M7 1v8M4 6l3 3 3-3M1 13v2a2 2 0 002 2h8a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0e1528",
              letterSpacing: "-0.24px",
              lineHeight: "31.2px",
              marginTop: 4,
            }}
          >
            {insights.prsMerged}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
            }}
          >
            PRs Merged
          </span>
        </div>
      </div>

      <div
        className="mt-4 flex flex-col gap-2"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 17 }}
      >
        <div className="flex items-center justify-between">
          <span style={monoLabel}>Primary Lang:</span>
          <span style={{ ...monoValue, color: "#f59e0b" }}>
            {insights.primaryLanguage}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span style={monoLabel}>Contributors:</span>
          <span style={monoValue}>{insights.contributors}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={monoLabel}>Last Update:</span>
          <span style={monoValue}>{insights.lastUpdate}</span>
        </div>
      </div>
    </div>
  );
}
