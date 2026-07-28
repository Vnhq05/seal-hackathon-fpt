"use client";

import Link from "next/link";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";

export type AssignmentWorkflowStep = "overview" | "teams" | "mentors" | "judges";

const STEPS: { id: Exclude<AssignmentWorkflowStep, "overview">; label: string; segment: string }[] = [
  { id: "teams", label: "Teams", segment: "assignments/teams" },
  { id: "mentors", label: "Mentors", segment: "assignments/mentors" },
  { id: "judges", label: "Judges", segment: "assignments" },
];

const TIPS: Record<AssignmentWorkflowStep, string> = {
  overview:
    "Recommended order: assign teams to tracks, then mentors, then judges. Use Overview to review the result.",
  teams:
    "Step 1 — Assign confirmed teams to tracks first. Mentors and judges depend on track assignment.",
  mentors:
    "Step 2 — Add mentors per track after teams have tracks, then draw or assign mentors to teams.",
  judges:
    "Step 3 — Assign judges after teams and mentors are set. Track mentors cannot judge the same track.",
};

export function AssignmentWorkflowBanner({ step }: { step: AssignmentWorkflowStep }) {
  const portalBase = useStaffPortalBase();

  return (
    <div
      className="mb-5 border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
      role="note"
    >
      <p className="font-medium">{TIPS[step]}</p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-sky-800">
        <span className="font-semibold uppercase tracking-wide text-sky-700">Suggested flow</span>
        {STEPS.map((s, index) => {
          const href = `${portalBase}/${s.segment}`;
          const active = step === s.id;
          return (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              {index > 0 && <span className="text-sky-400">→</span>}
              <Link
                href={href}
                className={
                  active
                    ? "border border-sky-400 bg-white px-2 py-0.5 font-bold text-sky-900"
                    : "border border-transparent px-2 py-0.5 underline-offset-2 hover:underline"
                }
              >
                {index + 1}. {s.label}
              </Link>
            </span>
          );
        })}
      </p>
    </div>
  );
}
