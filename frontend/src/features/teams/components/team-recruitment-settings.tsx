"use client";

import { useState } from "react";
import {
  HACKATHON_SKILL_ROLE_LABELS,
  type HackathonSkillRole,
} from "@/lib/api/types";
import type { TeamResponse } from "@/lib/api/team.api";
import { useUpdateRecruitment } from "@/features/teams/hooks/use-update-recruitment";

const ALL_ROLES = Object.keys(HACKATHON_SKILL_ROLE_LABELS) as HackathonSkillRole[];

interface TeamRecruitmentSettingsProps {
  eventId: string;
  team: TeamResponse;
}

function TeamRecruitmentForm({ eventId, team }: TeamRecruitmentSettingsProps) {
  const { mutate: save, isPending, error } = useUpdateRecruitment(eventId, team.id);
  const [isRecruiting, setIsRecruiting] = useState(team.isRecruiting);
  const [note, setNote] = useState(team.recruitmentNote ?? "");
  const [roles, setRoles] = useState<Set<HackathonSkillRole>>(
    new Set(team.neededRoles ?? []),
  );
  const [saved, setSaved] = useState(false);

  const canRecruit = team.memberCount < team.maxTeamMembers;

  const toggleRole = (role: HackathonSkillRole) => {
    setRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else if (next.size < 5) next.add(role);
      return next;
    });
  };

  const handleSave = () => {
    setSaved(false);
    save(
      {
        isRecruiting: canRecruit && isRecruiting,
        recruitmentNote: note.trim() || undefined,
        neededRoles: Array.from(roles),
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5">
      <h3 className="text-sm font-semibold text-seal-text">Recruitment settings</h3>
      <p className="mt-1 text-xs text-seal-text-muted">
        Advertise open roles so solo participants can find your team.
      </p>

      {!canRecruit && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Team is full — recruiting is disabled.
        </p>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-seal-text">
        <input
          type="checkbox"
          checked={isRecruiting && canRecruit}
          disabled={!canRecruit}
          onChange={(e) => setIsRecruiting(e.target.checked)}
          className="rounded border-seal-border"
        />
        Open for recruitment
      </label>

      <div className="mt-3">
        <label className="text-xs font-medium text-seal-text-secondary">Recruitment note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="What kind of teammates are you looking for?"
          className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text shadow-[2px_2px_0_0_#0c1228] outline-none focus:border-royal/40"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-seal-text-secondary">
          Needed roles (max 5)
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`border-2 border-navy px-2 py-1 text-xs font-medium shadow-[2px_2px_0_0_#0c1228] ${
                roles.has(role)
                  ? "bg-seal-yellow text-navy"
                  : "bg-white text-seal-text-muted hover:bg-seal-surface-sunken"
              }`}
            >
              {HACKATHON_SKILL_ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">
          {error instanceof Error ? error.message : "Failed to save recruitment settings"}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono text-sm font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save recruitment"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-700">Saved</span>
        )}
      </div>
    </div>
  );
}

export function TeamRecruitmentSettings({ eventId, team }: TeamRecruitmentSettingsProps) {
  return (
    <TeamRecruitmentForm
      key={`${team.id}-${team.isRecruiting}-${team.recruitmentNote ?? ""}-${(team.neededRoles ?? []).join(",")}`}
      eventId={eventId}
      team={team}
    />
  );
}
