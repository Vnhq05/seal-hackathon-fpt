"use client";

import type { MentorTeamMember } from "@/features/mentor/types/mentor.types";

function PersonIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden="true">
      <circle cx="11" cy="7" r="4" stroke="rgba(223,226,236,0.8)" strokeWidth="1.3" />
      <path d="M3 20c0-4 3.5-7 8-7s8 3 8 7" stroke="rgba(223,226,236,0.8)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LeaderBadge() {
  return (
    <svg width="17" height="20" viewBox="0 0 17 20" fill="none" aria-hidden="true" style={{ position: "absolute", top: 0, right: 0 }}>
      <path d="M0 0h17v16l-8.5 4L0 16V0z" fill="#10b981" />
      <path d="M5 8l2.5 2.5L12 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MemberCard({ member }: { member: MentorTeamMember }) {
  const isLeader = member.isLeader;
  return (
    <div
      className="flex items-center gap-4 rounded-lg"
      style={{
        backgroundColor: "#eef0f6",
        border: `1px solid ${isLeader ? "#38bdf8" : "rgba(223,226,236,0.8)"}`,
        padding: 17,
        position: "relative",
        boxShadow: isLeader ? "0px 0px 0px 1px rgba(99,102,241,0.2)" : "none",
        overflow: "hidden",
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ width: 48, height: 48, backgroundColor: "#dcfce7", border: "1px solid rgba(223,226,236,0.8)" }}
      >
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0ea5e9" }}>
            {member.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0e1528", letterSpacing: "0.24px", lineHeight: "12px" }}>
          {member.name}
        </span>
        <span style={{ fontSize: 12, color: "#8891a5", lineHeight: "18px" }}>
          {isLeader ? `Team Leader • ${member.role}` : member.role}
        </span>
      </div>
      {isLeader && <LeaderBadge />}
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      className="flex items-center gap-4 rounded-lg"
      style={{ backgroundColor: "#eef0f6", border: "1px dashed rgba(223,226,236,0.8)", padding: 17, opacity: 0.6 }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-full"
        style={{ width: 48, height: 48, backgroundColor: "rgba(223,226,236,0.8)", border: "1px dashed rgba(223,226,236,0.8)" }}
      >
        <PersonIcon />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
        Empty Slot
      </span>
    </div>
  );
}

function TeamIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke="#0e1528" strokeWidth="1.5" />
      <path d="M2 16c0-3 2.5-5 6-5s6 2 6 5" stroke="#0e1528" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="4" r="2" stroke="#0e1528" strokeWidth="1.2" />
      <path d="M20 16c0-2-1.5-4-4-4" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  members: MentorTeamMember[];
  memberCount: number;
  maxMembers: number;
}

export function MentorTeamMembers({ members, memberCount, maxMembers }: Props) {
  const emptySlots = Math.max(0, maxMembers - members.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <TeamIcon />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          Team Members ({memberCount}/{maxMembers})
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {members.map((m) => <MemberCard key={m.id} member={m} />)}
        {Array.from({ length: emptySlots }).map((_, i) => <EmptySlot key={`empty-${i}`} />)}
      </div>
    </div>
  );
}
