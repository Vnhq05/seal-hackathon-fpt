"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStaffPortalBase } from "@/shared/hooks/use-staff-portal-base";

const TABS = [
  { segment: "assignments/overview", label: "Overview", exact: false, step: "overview" },
  { segment: "assignments/teams", label: "Team assignments", exact: false, step: "teams" },
  { segment: "assignments/mentors", label: "Mentor assignments", exact: false, step: "mentors" },
  { segment: "assignments", label: "Judge assignments", exact: true, step: "judges" },
] as const;

const FLOW_STEPS = [
  { n: 1, label: "Teams" },
  { n: 2, label: "Mentors" },
  { n: 3, label: "Judges" },
] as const;

const STEP_COPY: Record<(typeof TABS)[number]["step"], string> = {
  overview:
    "Follow the suggested flow below. Assign teams to tracks first — mentors and judges depend on track assignment.",
  teams:
    "Step 1 — Assign confirmed teams to tracks first. Mentors and judges depend on track assignment.",
  mentors:
    "Step 2 — Build the mentor pool per track, then assign mentors to teams that already have a track.",
  judges:
    "Step 3 — Assign judges to a round or track after teams are on tracks.",
};

function resolveActiveStep(pathname: string, portalBase: string): (typeof TABS)[number]["step"] {
  if (pathname.startsWith(`${portalBase}/assignments/overview`)) return "overview";
  if (pathname.startsWith(`${portalBase}/assignments/teams`)) return "teams";
  if (pathname.startsWith(`${portalBase}/assignments/mentors`)) return "mentors";
  return "judges";
}

export function StaffAssignmentNav() {
  const portalBase = useStaffPortalBase();
  const pathname = usePathname();
  const activeStep = resolveActiveStep(pathname, portalBase);

  return (
    <div className="mb-6">
      <nav
        className="mb-3 flex flex-wrap gap-2 border-b-2 border-navy/10 pb-3"
        aria-label="Assignment sections"
      >
        {TABS.map((tab) => {
          const href = `${portalBase}/${tab.segment}`;
          const active = tab.exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`border-2 px-4 py-2 text-sm font-mono font-bold transition-colors ${
                active
                  ? "border-navy bg-seal-yellow text-navy shadow-[3px_3px_0_0_#0c1228]"
                  : "border-navy/30 bg-white text-seal-text-secondary hover:border-navy hover:text-navy"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div
        className="flex flex-col gap-3 border border-sky-200 bg-sky-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        role="note"
      >
        <p className="text-sm text-sky-900">{STEP_COPY[activeStep]}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-800">
          <span className="text-sky-600">Suggested flow</span>
          {FLOW_STEPS.map((step, idx) => {
            const isCurrent =
              (step.n === 1 && activeStep === "teams") ||
              (step.n === 2 && activeStep === "mentors") ||
              (step.n === 3 && activeStep === "judges");
            return (
              <span key={step.n} className="inline-flex items-center gap-2">
                {idx > 0 && <span className="text-sky-400" aria-hidden>→</span>}
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-sky-700 text-white"
                      : "bg-sky-200 text-sky-900"
                  }`}
                >
                  {step.n}
                </span>
                <span className={isCurrent ? "text-sky-950" : undefined}>{step.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
