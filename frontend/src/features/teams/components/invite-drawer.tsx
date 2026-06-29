"use client";

import { useState } from "react";
import type { Team } from "@/features/teams/types/team.types";
import { Drawer } from "@/shared/ui/drawer";
import { InviteSearchInput } from "@/features/teams/components/invite-search-input";
import { InviteSearchResults } from "@/features/teams/components/invite-search-results";
import { InvitePendingSection } from "@/features/teams/components/invite-pending-section";
import { ParticipationBlockBanner } from "@/features/events/components/participation-block-banner";
import { useDebounce } from "@/features/teams/hooks/use-debounce";

interface InviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  registrationClosed?: boolean;
  registrationClosedReason?: string | null;
}

export function InviteDrawer({
  isOpen,
  onClose,
  team,
  registrationClosed = false,
  registrationClosedReason,
}: InviteDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width={420}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#eef0f6",
          borderBottom: "1px solid rgba(223,226,236,0.8)",
          padding: "16px 24px 17px",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#0e1528",
                letterSpacing: "-0.24px",
                lineHeight: "31.2px",
              }}
            >
              Invite a member
            </h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden="true">
                  <circle cx="4.5" cy="3" r="2" stroke="currentColor" strokeWidth="1" />
                  <path d="M0 9c0-2 1.8-3.5 4.5-3.5S9 7 9 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <circle cx="9.5" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M13 9c0-1.5-1.2-2.8-3-2.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
                  {team.name}
                </span>
              </span>
              {team.trackName && (
                <>
                  <span className="rounded-full" style={{ width: 4, height: 4, backgroundColor: "rgba(223,226,236,0.8)" }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
                    {team.trackName}
                  </span>
                </>
              )}
              <span className="rounded-full" style={{ width: 4, height: 4, backgroundColor: "rgba(223,226,236,0.8)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#0e1528", letterSpacing: "0.24px", lineHeight: "12px" }}>
                {team.memberCount} / {team.maxMembers} members
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Close drawer"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="#0e1528" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-auto">
        <div style={{ padding: "24px 24px 16px" }}>
          {registrationClosed && registrationClosedReason && (
            <div style={{ marginBottom: 12 }}>
              <ParticipationBlockBanner reason={registrationClosedReason} />
            </div>
          )}
          <InviteSearchInput value={searchTerm} onChange={setSearchTerm} disabled={registrationClosed} />
        </div>

        <div
          style={{
            padding: "0 24px 25px",
            borderBottom: "1px solid rgba(223,226,236,0.8)",
          }}
        >
          <InviteSearchResults
            teamId={team.id}
            search={debouncedSearch}
            registrationClosed={registrationClosed}
          />
        </div>

        <InvitePendingSection teamId={team.id} />
      </div>

      {/* Footer */}
      <div
        className="flex items-start gap-2"
        style={{
          backgroundColor: "#eef0f6",
          borderTop: "1px solid rgba(223,226,236,0.8)",
          padding: "17px 16px 16px",
        }}
      >
        <svg
          width="15"
          height="17"
          viewBox="0 0 15 17"
          fill="none"
          aria-hidden="true"
          className="flex-shrink-0"
          style={{ marginTop: 1 }}
        >
          <circle cx="7.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="1" />
          <path d="M7.5 5v4M7.5 11.5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "19.5px" }}>
          Only participants registered and approved for HackFPT 2025 appear in results.
        </p>
      </div>
    </Drawer>
  );
}
