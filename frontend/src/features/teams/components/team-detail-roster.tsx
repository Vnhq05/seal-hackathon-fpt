import type { TeamDetail } from "@/features/teams/types/team.types";
import { TeamDetailMemberCard } from "@/features/teams/components/team-detail-member-card";
import { TeamDetailEmptySlot } from "@/features/teams/components/team-detail-empty-slot";

interface TeamDetailRosterProps {
  team: TeamDetail;
  onInvite: () => void;
}

function InviteIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="4" r="3" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M0 12c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3v6M11 6h6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TeamDetailRoster({ team, onInvite }: TeamDetailRosterProps) {
  const emptySlots = Math.max(0, team.maxMembers - team.members.length);

  return (
    <div
      className="flex flex-col rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 25,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div className="flex items-center justify-between" style={{ paddingBottom: 16 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#0e1528",
            letterSpacing: "-0.24px",
            lineHeight: "31.2px",
          }}
        >
          Squad Roster
        </h2>
        <span
          className="rounded"
          style={{
            backgroundColor: "#eef0f6",
            padding: "4px 8px",
            fontSize: 12,
            color: "#8891a5",
            letterSpacing: "0.24px",
            lineHeight: "12px",
          }}
        >
          {team.memberCount}/{team.maxMembers} Capacity
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {team.members.map((member) => (
          <TeamDetailMemberCard key={member.id} member={member} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <TeamDetailEmptySlot key={`empty-${i}`} onClick={onInvite} />
        ))}
      </div>

      <div
        className="flex items-start justify-end"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", marginTop: 16, paddingTop: 17 }}
      >
        <button
          type="button"
          onClick={onInvite}
          className="flex items-center gap-3 rounded-lg"
          style={{
            backgroundColor: "#38bdf8",
            border: "none",
            padding: "9px 24px",
            cursor: "pointer",
            filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
          }}
        >
          <InviteIcon />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: "25.2px",
            }}
          >
            Invite Teammate
          </span>
        </button>
      </div>
    </div>
  );
}
