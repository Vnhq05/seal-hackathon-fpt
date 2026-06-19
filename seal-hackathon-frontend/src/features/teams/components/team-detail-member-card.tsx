import type { TeamDetailMember } from "@/features/teams/types/team.types";

interface TeamDetailMemberCardProps {
  member: TeamDetailMember;
}

function StarIcon() {
  return (
    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" aria-hidden="true">
      <path
        d="M6 0l1.76 3.56L11.66 4.2 8.83 6.94l.67 3.88L6 9.02 2.5 10.82l.67-3.88L.34 4.2l3.9-.64L6 0z"
        fill="#dec29a"
      />
    </svg>
  );
}

export function TeamDetailMemberCard({ member }: TeamDetailMemberCardProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg"
      style={{
        backgroundColor: member.isLeader ? "#eef0f6" : "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
        minHeight: 200,
        padding: "40px 16px 24px",
      }}
    >
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: 64,
          height: 64,
          border: "1px solid rgba(223,226,236,0.8)",
          flexShrink: 0,
          marginBottom: 8,
        }}
      >
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: "rgba(223,226,236,0.8)", fontSize: 22, fontWeight: 700, color: "#0ea5e9" }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#0e1528",
          lineHeight: "25.2px",
          textAlign: "center",
        }}
      >
        {member.name}
      </span>

      <div className="mt-1 flex items-center gap-1">
        {member.isLeader ? (
          <>
            <StarIcon />
            <span style={{ fontSize: 12, color: "#dec29a", letterSpacing: "0.24px", lineHeight: "12px" }}>
              Leader
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
            {member.role}
          </span>
        )}
      </div>
    </div>
  );
}
