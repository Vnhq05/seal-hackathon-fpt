import type { SubmissionEvaluation as EvalType } from "@/features/submissions/types/submission-detail.types";

interface SubmissionEvaluationProps {
  evaluation: EvalType;
}

function CriterionBar({
  name,
  score,
  maxScore,
}: {
  name: string;
  score: number;
  maxScore: number;
}) {
  const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", lineHeight: "21px" }}>
          {name}
        </span>
        <span style={{ fontSize: 13, color: "#0e1528", fontFamily: "monospace", lineHeight: "19.5px" }}>
          {score}/{maxScore}
        </span>
      </div>
      <div
        className="w-full overflow-hidden rounded-full"
        style={{ height: 8, backgroundColor: "#dcfce7" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "#10b981",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export function SubmissionEvaluation({ evaluation }: SubmissionEvaluationProps) {
  return (
    <div
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid rgba(223,226,236,0.8)",
        borderRadius: 8,
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(223,226,236,0.8)",
          paddingBottom: 17,
          marginBottom: 24,
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
            <rect x="2" y="1" width="16" height="16" rx="2" stroke="#0e1528" strokeWidth="1.5" />
            <path
              d="M6 6h8M6 9h8M6 12h5"
              stroke="#0e1528"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
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
            Judging Evaluation
          </h2>
        </div>

        <div className="flex flex-col items-end">
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            Total Score
          </span>
          <div className="flex items-baseline">
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#10b981",
                lineHeight: "38.4px",
                letterSpacing: "-0.64px",
              }}
            >
              {evaluation.totalScore}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#8891a5",
                lineHeight: "25.2px",
              }}
            >
              /{evaluation.maxTotalScore}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            Criteria Breakdown
          </span>
          <div className="flex flex-col gap-3">
            {evaluation.criteria.map((c) => (
              <CriterionBar
                key={c.id}
                name={c.name}
                score={c.score}
                maxScore={c.maxScore}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}
          >
            Anonymous Feedback
          </span>
          <div className="flex flex-col gap-4">
            {evaluation.feedback.map((fb) => (
              <div
                key={fb.id}
                className="flex flex-col gap-2"
                style={{
                  backgroundColor: "#ffffff",
                  borderLeft: "4px solid #38bdf8",
                  borderTop: "1px solid #38bdf8",
                  borderRight: "1px solid #38bdf8",
                  borderBottom: "1px solid #38bdf8",
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                  padding: "17px 17px 17px 20px",
                }}
              >
                <div className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <circle cx="5.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1" />
                    <path
                      d="M1.5 10.5c0-2.21 1.79-4 4-4s4 1.79 4 4"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8891a5",
                      letterSpacing: "0.24px",
                    }}
                  >
                    {fb.author}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "#0e1528",
                    lineHeight: "21px",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{fb.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
