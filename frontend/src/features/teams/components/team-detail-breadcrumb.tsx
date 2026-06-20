import Link from "next/link";

interface TeamDetailBreadcrumbProps {
  hackathonName: string;
  teamName: string;
}

function ChevronIcon() {
  return (
    <svg width="5" height="8" viewBox="0 0 5 8" fill="none" aria-hidden="true">
      <path d="M1 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TeamDetailBreadcrumb({ hackathonName, teamName }: TeamDetailBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      <Link
        href="/participant"
        style={{ fontSize: 12, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}
      >
        {hackathonName}
      </Link>
      <ChevronIcon />
      <Link
        href="/participant/teams"
        style={{ fontSize: 12, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}
      >
        Teams
      </Link>
      <ChevronIcon />
      <span
        style={{ fontSize: 12, color: "#0e1528", fontWeight: 500, letterSpacing: "0.24px", lineHeight: "12px" }}
      >
        {teamName}
      </span>
    </nav>
  );
}
