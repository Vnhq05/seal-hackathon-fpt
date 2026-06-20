import type { TeamMember } from "@/features/teams/types/team.types";

interface TeamAvatarStackProps {
  members: TeamMember[];
  size?: number;
  maxVisible?: number;
  totalCount?: number;
}

export function TeamAvatarStack({
  members,
  size = 32,
  maxVisible = 4,
  totalCount,
}: TeamAvatarStackProps) {
  const visible = members.slice(0, maxVisible);
  const remaining = (totalCount ?? members.length) - visible.length;

  return (
    <div className="flex items-start">
      {visible.map((member, i) => (
        <div
          key={member.id}
          className="relative overflow-hidden rounded-full"
          style={{
            width: size,
            height: size,
            marginRight: i < visible.length - 1 && remaining <= 0 ? 0 : -8,
            boxShadow: "0 0 0 2px white",
            backgroundColor: "rgba(223,226,236,0.8)",
            zIndex: visible.length - i,
          }}
          title={member.name}
        >
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                fontSize: size * 0.35,
                fontWeight: 700,
                color: "#0ea5e9",
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: "rgba(223,226,236,0.8)",
            border: "1px dashed rgba(223,226,236,0.8)",
            boxShadow: "0 0 0 2px white",
            fontSize: 12,
            fontWeight: 500,
            color: "#8891a5",
            letterSpacing: "0.24px",
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
