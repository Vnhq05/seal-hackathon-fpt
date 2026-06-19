import type { SubmissionArtifact } from "@/features/submissions/types/submission-detail.types";

interface SubmissionArtifactsProps {
  artifacts: SubmissionArtifact[];
}

const ARTIFACT_CONFIG: Record<
  SubmissionArtifact["type"],
  { bg: string; buttonLabel: string }
> = {
  repository: { bg: "#0e1528", buttonLabel: "Open Repository" },
  demo: { bg: "rgba(99,102,241,0.1)", buttonLabel: "Launch Demo" },
  presentation: { bg: "rgba(245,158,11,0.1)", buttonLabel: "View PDF" },
};

function ArtifactIcon({ type }: { type: SubmissionArtifact["type"] }) {
  if (type === "repository") {
    return (
      <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
        <path
          d="M7 1L1 6l6 5M13 1l6 5-6 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "demo") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="11" rx="2" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M7 17h6M10 14v3" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M4 2a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7l-5-5H4z"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M11 2v5h5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path
        d="M5 1H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V6M7 1h3m0 0v3m0-3L5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SubmissionArtifacts({ artifacts }: SubmissionArtifactsProps) {
  if (artifacts.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid rgba(223,226,236,0.8)",
        borderRadius: 8,
        padding: 25,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
          <path
            d="M8 5h4M6 1a4 4 0 100 8 4 4 0 000-8zM14 1a4 4 0 110 8 4 4 0 010-8z"
            stroke="#0e1528"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          Submission Artifacts
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {artifacts.map((artifact) => {
          const config = ARTIFACT_CONFIG[artifact.type];
          return (
            <div
              key={artifact.id}
              className="flex items-center justify-between rounded-lg"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(223,226,236,0.8)",
                padding: 17,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded"
                  style={{ width: 40, height: 40, backgroundColor: config.bg }}
                >
                  <ArtifactIcon type={artifact.type} />
                </div>
                <div className="flex flex-col">
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", lineHeight: "21px" }}>
                    {artifact.title}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8891a5",
                      letterSpacing: "0.24px",
                    }}
                  >
                    {artifact.subtitle}
                  </span>
                </div>
              </div>
              <a
                href={artifact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(223,226,236,0.8)",
                  padding: "9px 17px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0e1528",
                  letterSpacing: "0.24px",
                  textDecoration: "none",
                }}
              >
                {config.buttonLabel}
                <ExternalLinkIcon />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
