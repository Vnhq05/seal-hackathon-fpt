import type { HackathonDetail } from "@/features/events/types/hackathon-registration.types";

function CalendarSmallIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <rect
        x="0.75"
        y="2.75"
        width="10.5"
        height="9.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 0.5v3M8.5 0.5v3M0.75 5.5h10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const month = start.toLocaleString("en-US", { month: "short" });
  return `${month} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
}

interface RegistrationHeaderProps {
  hackathon: HackathonDetail;
}

export function RegistrationHeader({ hackathon }: RegistrationHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded"
        style={{
          width: 80,
          height: 80,
          backgroundColor: "rgba(223,226,236,0.8)",
          border: "1px solid rgba(223,226,236,0.8)",
        }}
      >
        {hackathon.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hackathon.bannerUrl}
            alt={hackathon.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#0e1528",
            lineHeight: "31.2px",
            letterSpacing: "-0.24px",
            margin: 0,
          }}
        >
          {hackathon.name}
        </h1>
        <div className="flex items-center gap-1">
          <CalendarSmallIcon />
          <span style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
            {formatDateRange(hackathon.startDate, hackathon.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
