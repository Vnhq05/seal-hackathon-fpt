"use client";

import { useState } from "react";
import type { EventResponse } from "@/lib/api";
import { CreateTeamPanel } from "@/features/teams/components/create-team-panel";
import { JoinTeamPanel } from "@/features/teams/components/join-team-panel";

interface NoTeamPanelProps {
  event: EventResponse;
  onTeamCreated?: () => void;
}

export function NoTeamPanel({ event, onTeamCreated }: NoTeamPanelProps) {
  const [subTab, setSubTab] = useState<"create" | "join">("create");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg border border-seal-border bg-seal-surface p-1 self-start">
        {([
          { key: "create" as const, label: "Create Team" },
          { key: "join" as const, label: "Join Team" },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              subTab === t.key
                ? "bg-seal-cyan/10 text-seal-cyan"
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
