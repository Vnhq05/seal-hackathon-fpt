"use client";

import { useState } from "react";
import type { EventResponse } from "@/lib/api";
import { CreateTeamPanel } from "@/features/teams/components/create-team-panel";
import { JoinTeamPanel } from "@/features/teams/components/join-team-panel";
import { MatchingProfilePanel } from "@/features/teams/components/matching-profile-panel";

interface NoTeamPanelProps {
  event: EventResponse;
  onTeamCreated?: () => void;
}

export function NoTeamPanel({ event, onTeamCreated }: NoTeamPanelProps) {
  const [subTab, setSubTab] = useState<"create" | "join">("create");

  return (
    <div className="flex flex-col gap-4">
      <MatchingProfilePanel eventId={event.id} />

      <div className="flex gap-1 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-1 self-start">
        {([
          { key: "create" as const, label: "Create Team" },
          { key: "join" as const, label: "Join Team" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              subTab === t.key
                ? "bg-seal-yellow text-navy font-mono font-bold"
                : "text-seal-text-muted hover:text-seal-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "create" ? (
        <CreateTeamPanel event={event} onCreated={onTeamCreated} />
      ) : (
        <JoinTeamPanel event={event} />
      )}
    </div>
  );
}
