"use client";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}>
      <path
        d="M8.57 3.22L1.51 15a1.5 1.5 0 001.29 2.25h14.14a1.5 1.5 0 001.29-2.25L11.17 3.22a1.5 1.5 0 00-2.6 0z"
        stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M10 7.5v3M10 13.5h.01" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface StaffActionBannerProps {
  pendingApprovals: number;
  flaggedTeams: number;
}

export function StaffActionBanner({ pendingApprovals, flaggedTeams }: StaffActionBannerProps) {
  if (pendingApprovals === 0 && flaggedTeams === 0) return null;

  const parts: string[] = [];
  if (pendingApprovals > 0) parts.push(`${pendingApprovals} accounts pending approval`);
  if (flaggedTeams > 0) parts.push(`${flaggedTeams} teams flagged for review`);

  return (
    <div
      className="flex items-start gap-3 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{ backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b", padding: "14px 20px", marginBottom: 24 }}
    >
      <WarningIcon />
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", lineHeight: "20px" }}>
          Action Required
        </p>
        <p style={{ fontSize: 13, color: "#92400e", lineHeight: "20px", marginTop: 2 }}>
          {parts.join(" · ")}
        </p>
      </div>
    </div>
  );
}
