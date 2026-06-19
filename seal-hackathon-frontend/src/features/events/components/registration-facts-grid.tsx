import type { HackathonDetail } from "@/features/events/types/hackathon-registration.types";

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#8891a5",
  letterSpacing: "0.24px",
  textTransform: "uppercase",
  lineHeight: "12px",
};

const valueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#0e1528",
  lineHeight: "25.2px",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "rgba(223,226,236,0.8)",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 4,
  padding: 17,
};

interface FactCardProps {
  label: string;
  value: string;
}

function FactCard({ label, value }: FactCardProps) {
  return (
    <div className="flex flex-col gap-1" style={cardStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

function formatDeadline(date: string): string {
  const d = new Date(date);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  return `${month} ${day}${suffix}`;
}

function formatTeamSize(min: number, max: number): string {
  if (min === max) return `${min} Members`;
  return `${min} - ${max} Members`;
}

interface RegistrationFactsGridProps {
  hackathon: HackathonDetail;
}

export function RegistrationFactsGrid({
  hackathon,
}: RegistrationFactsGridProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <FactCard label="FORMAT" value={hackathon.format} />
      <FactCard
        label="TEAM SIZE"
        value={formatTeamSize(hackathon.minTeamSize, hackathon.maxTeamSize)}
      />
      <FactCard label="PRIZE POOL" value={hackathon.prizePool} />
      <FactCard
        label="DEADLINE"
        value={formatDeadline(hackathon.registrationDeadline)}
      />
    </div>
  );
}
