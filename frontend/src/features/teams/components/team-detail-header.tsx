import type { TeamDetail } from "@/features/teams/types/team.types";

interface TeamDetailHeaderProps {
  team: TeamDetail;
}

function LeaderIcon() {
  return (
    <svg width="21" height="28" viewBox="0 0 21 28" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 27c0-5.523 4.253-10 9.5-10S20 21.477 20 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TeamDetailHeader({ team }: TeamDetailHeaderProps) {
  const leader = team.leader;

  return (
    <div
      className="flex items-center justify-between rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div className="flex flex-col gap-2">
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.8px",
            lineHeight: "38.4px",
          }}
        >
          {team.name}
        </h1>

        <div className="flex items-center gap-2">
          {team.track.name && (
            <span
              className="rounded-full"
              style={{
                backgroundColor: "#dcfce7",
                border: "1px solid #bec6e0",
                padding: "5px 13px",
                fontSize: 12,
                color: "#0ea5e9",
                letterSpacing: "0.24px",
                lineHeight: "12px",
              }}
            >
              {team.track.name}
            </span>
          )}
          <span
            className="flex items-center gap-1 rounded-full"
            style={{
              backgroundColor: "#e1e2ed",
              border: "1px solid #c4c6d1",
              padding: "5px 13px",
              fontSize: 12,
              color: "#191b24",
              letterSpacing: "0.24px",
              lineHeight: "12px",
            }}
          >
            <span
              className="rounded-full"
              style={{ width: 8, height: 8, backgroundColor: "#191b24" }}
            />
            {team.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>

        <p
          style={{
            fontSize: 14,
            color: "#8891a5",
            lineHeight: "21px",
            paddingTop: 8,
            maxWidth: 576,
          }}
        >
          {team.description}
        </p>
      </div>

      {leader && (
        <div
          className="flex items-center gap-4 rounded-lg"
          style={{
            backgroundColor: "#eef0f6",
            border: "1px solid rgba(223,226,236,0.8)",
            padding: "9px 17px",
          }}
        >
          <LeaderIcon />
          <div className="flex flex-col gap-1">
            <span
              style={{
                fontSize: 12,
                color: "#8891a5",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                lineHeight: "12px",
              }}
            >
              TEAM LEADER
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0e1528",
                lineHeight: "25.2px",
              }}
            >
              {leader.name}
            </span>
          </div>
          <div
            className="overflow-hidden rounded-full"
            style={{
              width: 48,
              height: 48,
              border: "2px solid #ffffff",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            {leader.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={leader.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ backgroundColor: "#dcfce7", fontSize: 16, fontWeight: 700, color: "#0ea5e9" }}
              >
                {leader.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
