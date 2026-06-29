"use client";

import { useState } from "react";
import {
  HACKATHON_SKILL_ROLE_LABELS,
  type HackathonSkillRole,
} from "@/lib/api/types";
import type { EnrollmentResponse } from "@/lib/api/enrollment.api";
import { useMyEnrollment } from "@/features/events/hooks/use-enrollment";
import { useUpdateMatchingProfile } from "@/features/teams/hooks/use-update-matching-profile";

const ALL_ROLES = Object.keys(HACKATHON_SKILL_ROLE_LABELS) as HackathonSkillRole[];

interface MatchingProfilePanelProps {
  eventId: string;
}

function MatchingProfileForm({
  eventId,
  enrollment,
}: {
  eventId: string;
  enrollment: EnrollmentResponse;
}) {
  const { mutate: save, isPending, error } = useUpdateMatchingProfile(eventId);
  const isApproved = enrollment.status === "APPROVED";
  const [isLookingForTeam, setIsLookingForTeam] = useState(enrollment.isLookingForTeam);
  const [preferredRole, setPreferredRole] = useState<HackathonSkillRole | "">(
    enrollment.preferredRole ?? "",
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(false);
    save(
      {
        isLookingForTeam,
        preferredRole: preferredRole || null,
      },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-5">
      <h3 className="text-sm font-semibold text-seal-text">Your matching profile</h3>
      <p className="mt-1 text-xs text-seal-text-muted">
        Let team leaders know you are looking for a team and what role you prefer.
      </p>

      {!isApproved && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Your enrollment must be approved before you can update your matching profile.
        </p>
      )}

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-seal-text">
        <input
          type="checkbox"
          checked={isLookingForTeam}
          disabled={!isApproved}
          onChange={(e) => setIsLookingForTeam(e.target.checked)}
          className="rounded border-seal-border disabled:opacity-50"
        />
        I am looking for a team
      </label>

      <div className="mt-3">
        <label className="text-xs font-medium text-seal-text-secondary">Preferred role</label>
        <select
          value={preferredRole}
          disabled={!isApproved}
          onChange={(e) => setPreferredRole(e.target.value as HackathonSkillRole | "")}
          className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text shadow-[2px_2px_0_0_#0c1228] outline-none focus:border-royal/40 disabled:opacity-50"
        >
          <option value="">— Not specified —</option>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {HACKATHON_SKILL_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600">
          {error instanceof Error ? error.message : "Failed to save matching profile"}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isApproved}
          className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono text-sm font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save profile"}
        </button>
        {saved && <span className="text-xs text-emerald-700">Saved</span>}
      </div>
    </div>
  );
}

export function MatchingProfilePanel({ eventId }: MatchingProfilePanelProps) {
  const { data: enrollment, isLoading } = useMyEnrollment(eventId);

  if (isLoading) {
    return (
      <div className="border-2 border-navy bg-white p-5 text-sm text-seal-text-muted shadow-[4px_4px_0_0_#0c1228]">
        Loading matching profile...
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="border-2 border-navy bg-white p-5 text-sm text-seal-text-muted shadow-[4px_4px_0_0_#0c1228]">
        Enroll in this event to set your matching profile.
      </div>
    );
  }

  return (
    <MatchingProfileForm
      key={`${enrollment.id}-${enrollment.isLookingForTeam}-${enrollment.preferredRole ?? ""}`}
      eventId={eventId}
      enrollment={enrollment}
    />
  );
}
