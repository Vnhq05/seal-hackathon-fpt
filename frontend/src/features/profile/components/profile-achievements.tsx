"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMyAchievements } from "@/features/profile/hooks/use-my-achievements";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { AchievementCertificateDialog } from "@/features/profile/components/achievement-certificate-dialog";
import {
  buildCertificateData,
  formatAchievementPrize,
} from "@/features/profile/utils/build-certificate-data";
import type { UserAchievement } from "@/lib/api/admin-user.api";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";
import type { EventStatus } from "@/lib/api";

const STATUS_LABELS: Partial<Record<EventStatus, string>> = {
  UPCOMING: "Upcoming",
  OPEN: "Open",
  CLOSED_REGISTRATION: "Registration closed",
  ACTIVE: "Active",
  SCORING: "Scoring",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Partial<Record<EventStatus, string>> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SCORING: "bg-violet-50 text-violet-800 border-violet-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  OPEN: "bg-sky-50 text-sky-800 border-sky-200",
  CLOSED_REGISTRATION: "bg-amber-50 text-amber-900 border-amber-200",
  UPCOMING: "bg-sky-50 text-sky-800 border-sky-200",
  CANCELLED: "bg-red-50 text-red-800 border-red-200",
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
      {children}
    </div>
  );
}

export function ProfileAchievements() {
  const { data: myEvents = [], isLoading, isError } = useMyTeamsAllEvents();
  const { data: achievements = [] } = useMyAchievements();
  const { data: profile } = useProfile();
  const [certificate, setCertificate] = useState<CertificateTemplateData | null>(null);

  const achievementsByEvent = useMemo(() => {
    const map = new Map<string, UserAchievement[]>();
    for (const achievement of achievements) {
      const list = map.get(achievement.eventId) ?? [];
      list.push(achievement);
      map.set(achievement.eventId, list);
    }
    return map;
  }, [achievements]);

  const openCertificate = (achievement: UserAchievement) => {
    setCertificate(buildCertificateData(achievement, profile ?? null));
  };

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-2">
          {[0, 1].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <p className="text-center text-sm text-red-700">
          Failed to load your events. Please try again.
        </p>
      </Card>
    );
  }

  if (myEvents.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-seal-text-muted">
          You have not enrolled in any hackathon yet.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-navy">My Events</h3>
          <span className="text-xs text-seal-text-muted">
            {myEvents.length} {myEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {myEvents.map(({ event, team }) => {
            const eventAchievements = achievementsByEvent.get(event.id) ?? [];
            const statusLabel = STATUS_LABELS[event.status] ?? event.status;
            const statusStyle =
              STATUS_STYLES[event.status] ?? "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <article
                key={event.id}
                className="border border-seal-border bg-seal-surface-sunken/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-navy">{event.name}</h4>
                    <p className="mt-1 text-xs text-seal-text-muted">
                      {event.season} {event.year}
                      {team ? ` · Team ${team.name}` : " · No team yet"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/student/teams?eventId=${event.id}`}
                    className="inline-flex h-8 items-center border border-navy bg-white px-3 text-xs font-bold text-navy"
                  >
                    View team
                  </Link>
                  {eventAchievements.map((achievement) => {
                    const prize = formatAchievementPrize(achievement);
                    return (
                      <button
                        key={`${achievement.type}-${achievement.id}`}
                        type="button"
                        onClick={() => openCertificate(achievement)}
                        className="inline-flex h-8 items-center gap-1.5 border border-navy bg-white px-3 text-xs font-bold text-navy"
                        title={prize.label}
                      >
                        <span aria-hidden="true">📜</span>
                        Certificate
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </Card>

      <AchievementCertificateDialog
        open={certificate != null}
        data={certificate}
        onClose={() => setCertificate(null)}
      />
    </>
  );
}
