import Link from "next/link";
import type { JudgeDashboardUrgency } from "@/features/judging/types/judge.types";

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" stroke="#93000a" strokeWidth="1.3" />
      <path d="M10 6v5M10 13.5h.01" stroke="#93000a" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface JudgeUrgencyBannerProps {
  urgency: JudgeDashboardUrgency;
  portalBase?: string;
}

export function JudgeUrgencyBanner({ urgency, portalBase = "/judge" }: JudgeUrgencyBannerProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        backgroundColor: "#ffdad6",
        borderLeft: "4px solid #ba1a1a",
        borderRadius: "0 8px 8px 0",
        padding: "16px 16px 16px 20px",
      }}
    >
      <div className="flex items-center gap-2">
        <AlertIcon />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#93000a", lineHeight: "21px" }}>
          {urgency.message}
        </span>
      </div>
      <Link
        href={`${portalBase}/rounds/${urgency.roundId}`}
        style={{
          backgroundColor: "#ba1a1a",
          borderRadius: 4,
          padding: "4px 16px",
          fontSize: 12,
          fontWeight: 500,
          color: "#0e1528",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        Score Now
      </Link>
    </div>
  );
}
