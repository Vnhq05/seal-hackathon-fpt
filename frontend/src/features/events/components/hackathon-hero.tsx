import Link from "next/link";
import type { HackathonDetail } from "@/features/events/types/hackathon-detail.types";

interface HackathonHeroProps {
  hackathon: HackathonDetail;
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: "ONGOING",
  open: "OPEN",
  upcoming: "UPCOMING",
  ended: "ENDED",
};

export function HackathonHero({ hackathon }: HackathonHeroProps) {
  const { registration } = hackathon;

  return (
    <div className="relative flex items-end justify-center" style={{ height: 397 }}>
      <div className="absolute inset-0" style={{ backgroundColor: "#eef0f6" }}>
        {hackathon.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hackathon.bannerUrl}
            alt=""
            className="absolute h-full w-full object-cover"
          />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(1px)" }}
      />

      <div
        className="relative flex w-full items-end justify-between"
        style={{ maxWidth: 1280, padding: "32px 24px" }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full"
              style={{
                backgroundColor: "#565e74",
                border: "1px solid rgba(198,198,205,0.3)",
                padding: "5px 9px",
                fontSize: 12,
                fontWeight: 500,
                color: "#ffffff",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                lineHeight: "12px",
                backdropFilter: "blur(6px)",
              }}
            >
              {STATUS_LABELS[hackathon.status] ?? hackathon.status}
            </span>
            {registration.isRegistered && (
              <span
                className="flex items-center gap-1 rounded-full"
                style={{
                  backgroundColor: "#38bdf8",
                  border: "1px solid rgba(198,198,205,0.5)",
                  padding: "5px 9px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#8891a5",
                  letterSpacing: "0.24px",
                  lineHeight: "12px",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Registered
              </span>
            )}
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.64px",
              lineHeight: "38.4px",
              maxWidth: 672,
            }}
          >
            {hackathon.name}
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "rgba(223,226,236,0.8)",
              lineHeight: "21px",
              maxWidth: 576,
              paddingBottom: 8,
            }}
          >
            {hackathon.description}
          </p>
        </div>

        {registration.team && (
          <div style={{ paddingBottom: 8 }}>
            <Link
              href={`/student/teams/${registration.team.id}`}
              className="flex items-center gap-1"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#ffffff",
                letterSpacing: "0.24px",
                lineHeight: "12px",
              }}
            >
              View my team
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <path d="M4 2l4 3.5-4 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
