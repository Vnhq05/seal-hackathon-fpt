"use client";

import type { GitHubRepoInfo } from "@/features/submissions/types/submit-project.types";

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1C4.136 1 1 4.136 1 8c0 3.097 2.009 5.722 4.796 6.648.35.064.478-.152.478-.338 0-.166-.006-.607-.01-1.19-1.951.424-2.363-.94-2.363-.94-.319-.81-.778-1.025-.778-1.025-.636-.435.048-.426.048-.426.703.05 1.073.722 1.073.722.625 1.07 1.639.762 2.038.583.064-.453.244-.762.444-.937-1.557-.177-3.194-.779-3.194-3.466 0-.766.274-1.392.722-1.882-.072-.177-.313-.89.069-1.857 0 0 .589-.189 1.929.719A6.726 6.726 0 018 4.07c.597.003 1.197.08 1.758.237 1.338-.908 1.926-.719 1.926-.719.383.967.142 1.68.07 1.857.45.49.72 1.116.72 1.882 0 2.694-1.64 3.286-3.201 3.46.252.216.476.644.476 1.298 0 .937-.009 1.693-.009 1.923 0 .188.127.406.482.337C12.994 13.72 15 11.095 15 8c0-3.864-3.136-7-7-7z"
        fill="#8891a5"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.5l1.6 3.2 3.5.5-2.5 2.5.6 3.5L7 9.5l-3.2 1.7.6-3.5-2.5-2.5 3.5-.5L7 1.5z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="4" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 4.5V6a1 1 0 001 1h4a1 1 0 001-1V4.5M7 7v2.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

const containerStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 6,
  padding: 16,
  backgroundColor: "#fafafa",
};

const nameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0e1528",
  lineHeight: "20px",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "#8891a5",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 12,
  padding: "2px 8px",
  lineHeight: "16px",
};

const descStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#8891a5",
  lineHeight: "19px",
  margin: 0,
};

const metaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#8891a5",
  fontWeight: 500,
};

interface GitHubRepoPreviewProps {
  repo: GitHubRepoInfo;
}

export function GitHubRepoPreview({ repo }: GitHubRepoPreviewProps) {
  return (
    <div style={containerStyle} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <RepoIcon />
        <span style={nameStyle}>{repo.fullName}</span>
        <span style={badgeStyle}>{repo.visibility}</span>
      </div>

      {repo.description && <p style={descStyle}>{repo.description}</p>}

      <div className="flex items-center gap-4">
        {repo.language && (
          <span className="flex items-center gap-1" style={metaStyle}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: repo.languageColor || "#858585",
                display: "inline-block",
              }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1" style={metaStyle}>
          <StarIcon />
          {repo.stars.toLocaleString()}
        </span>
        <span className="flex items-center gap-1" style={metaStyle}>
          <ForkIcon />
          {repo.forks.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
