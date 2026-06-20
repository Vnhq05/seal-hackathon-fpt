interface SubmissionTechStackProps {
  techStack: string[];
}

export function SubmissionTechStack({ techStack }: SubmissionTechStackProps) {
  if (techStack.length === 0) return null;

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
        <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
          <path
            d="M1 3.5l5 3 5-3M1 9.5l5 3 5-3M1 6.5l5 3 5-3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
          Tech Stack
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="rounded"
            style={{
              backgroundColor: "#dcfce7",
              border: "1px solid rgba(223,226,236,0.8)",
              padding: "5px 9px",
              fontSize: 12,
              fontWeight: 500,
              color: "#0e1528",
              letterSpacing: "0.24px",
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
