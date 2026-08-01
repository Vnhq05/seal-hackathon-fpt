"use client";

import { useMemo, useState } from "react";
import { useMyAchievements } from "@/features/profile/hooks/use-my-achievements";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { AchievementCertificateDialog } from "@/features/profile/components/achievement-certificate-dialog";
import {
  buildCertificateData,
  formatAchievementPrize,
} from "@/features/profile/utils/build-certificate-data";
import { STATUS_DISPLAY_LABELS } from "@/features/events/utils/event-status.utils";
import { formatEventDate } from "@/features/events/utils/event-landing.utils";
import type { UserAchievement } from "@/lib/api/admin-user.api";
import type { EventStatus } from "@/lib/api/types";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";

const RANKING_LABELS = {
  FIRST: "1st Place",
  SECOND: "2nd Place",
  THIRD: "3rd Place",
  CONSOLATION: "Encouragement",
  OTHER: "Special",
} as const;

const STATUS_BADGE: Record<EventStatus, { bg: string; color: string }> = {
  UPCOMING: { bg: "#eef2ff", color: "#4338ca" },
  OPEN: { bg: "#ecfdf5", color: "#047857" },
  CLOSED_REGISTRATION: { bg: "#fffbeb", color: "#b45309" },
  ACTIVE: { bg: "#ecfeff", color: "#0e7490" },
  SCORING: { bg: "#f5f3ff", color: "#6d28d9" },
  COMPLETED: { bg: "#f1f5f9", color: "#475569" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626" },
};

type DisplayEvent = {
  id: string;
  name: string;
  status: EventStatus;
  season: string | null;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
  teamName: string | null;
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        border: "1px solid rgba(223,226,236,0.8)",
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function AchievementRow({
  achievement,
  onOpenCertificate,
}: {
  achievement: UserAchievement;
  onOpenCertificate: (achievement: UserAchievement) => void;
}) {
  const isAward = achievement.type === "TEAM_AWARD";
  const prize = formatAchievementPrize(achievement);

  return (
    <article
      className="flex gap-3"
      style={{
        padding: 14,
        border: `1px solid ${isAward ? "#fde68a" : "#bae6fd"}`,
        backgroundColor: isAward ? "#fffbeb" : "#f0f9ff",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          backgroundColor: isAward ? "#fbbf24" : "#38bdf8",
          color: "#ffffff",
          fontSize: 14,
        }}
        aria-hidden="true"
      >
        {isAward ? "★" : "✓"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h5 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>
            {achievement.eventName || "Hackathon"}
          </h5>
          <time style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
            {new Date(achievement.achievedAt).toLocaleDateString("en-US")}
          </time>
        </div>

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          <p style={{ fontSize: 12, color: "#64748b" }}>
            <span style={{ fontWeight: 600, color: "#475569" }}>Prize: </span>
            <span
              style={{
                color: isAward ? "#b45309" : "#0369a1",
                fontWeight: 700,
              }}
            >
              {prize.label}
            </span>
            {prize.detail ? (
              <span style={{ color: "#64748b" }}> — {prize.detail}</span>
            ) : null}
          </p>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            <span style={{ fontWeight: 600, color: "#475569" }}>Team: </span>
            {achievement.teamName || "—"}
          </p>
          {achievement.prizeRank ? (
            <p style={{ fontSize: 12, color: "#64748b" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Ranking: </span>
              {RANKING_LABELS[achievement.prizeRank]}
            </p>
          ) : null}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => onOpenCertificate(achievement)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 12px",
              border: "1px solid #1a2b56",
              background: "#fff",
              color: "#1a2b56",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true">📜</span>
            Certificate
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProfileAchievements() {
  const {
    data: myEvents = [],
    isLoading: eventsLoading,
    isError: eventsError,
  } = useMyTeamsAllEvents();
  const {
    data: achievements = [],
    isLoading: achievementsLoading,
    isError: achievementsError,
  } = useMyAchievements();
  const { data: profile } = useProfile();
  const [certificate, setCertificate] = useState<CertificateTemplateData | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const achievementsByEvent = useMemo(() => {
    const map = new Map<string, UserAchievement[]>();
    for (const achievement of achievements) {
      const list = map.get(achievement.eventId) ?? [];
      list.push(achievement);
      map.set(achievement.eventId, list);
    }
    return map;
  }, [achievements]);

  const displayEvents = useMemo(() => {
    const byId = new Map<string, DisplayEvent>();

    for (const { event, team } of myEvents) {
      byId.set(event.id, {
        id: event.id,
        name: event.name,
        status: event.status,
        season: event.season,
        year: event.year,
        startDate: event.startDate,
        endDate: event.endDate,
        teamName: team?.name ?? null,
      });
    }

    // Past competitions that only appear via certificates/awards.
    for (const achievement of achievements) {
      if (byId.has(achievement.eventId)) continue;
      byId.set(achievement.eventId, {
        id: achievement.eventId,
        name: achievement.eventName || "Hackathon",
        status: "COMPLETED",
        season: null,
        year: null,
        startDate: null,
        endDate: null,
        teamName: achievement.teamName,
      });
    }

    return [...byId.values()].sort((a, b) => {
      const aDone = a.status === "COMPLETED" || a.status === "CANCELLED" ? 1 : 0;
      const bDone = b.status === "COMPLETED" || b.status === "CANCELLED" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
      return bTime - aTime;
    });
  }, [myEvents, achievements]);

  const openCertificate = (achievement: UserAchievement) => {
    setCertificate(buildCertificateData(achievement, profile ?? null));
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEventId((current) => (current === eventId ? null : eventId));
  };

  const isLoading = eventsLoading || achievementsLoading;
  if (isLoading) {
    return (
      <Card>
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </Card>
    );
  }

  if (eventsError && achievementsError) {
    return (
      <Card>
        <p style={{ fontSize: 14, color: "#991b1b", textAlign: "center" }}>
          Failed to load your events. Please try again.
        </p>
      </Card>
    );
  }

  if (displayEvents.length === 0) {
    return (
      <Card>
        <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center" }}>
          You haven&apos;t joined any hackathons yet. Enroll in an event to see it here.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>My Events</h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {displayEvents.length} {displayEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        {eventsError ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "#b45309" }}>
            Some enrolled events could not be loaded. Showing available competitions.
          </p>
        ) : null}

        <div className="mt-3 space-y-2">
          {displayEvents.map((event) => {
            const badge = STATUS_BADGE[event.status] ?? STATUS_BADGE.UPCOMING;
            const eventAchievements = achievementsByEvent.get(event.id) ?? [];
            const isExpanded = expandedEventId === event.id;
            const metaParts = [
              event.season && event.year ? `${event.season} ${event.year}` : null,
              event.startDate && event.endDate
                ? `${formatEventDate(event.startDate)} – ${formatEventDate(event.endDate)}`
                : null,
            ].filter(Boolean);

            return (
              <article
                key={event.id}
                style={{
                  border: `1px solid ${isExpanded ? "#cbd5e1" : "#e2e8f0"}`,
                  backgroundColor: "#ffffff",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleEvent(event.id)}
                  aria-expanded={isExpanded}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 14,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>
                          {event.name}
                        </h4>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {STATUS_DISPLAY_LABELS[event.status] ?? event.status}
                        </span>
                        {eventAchievements.length > 0 ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 999,
                              backgroundColor: "#f0f9ff",
                              color: "#0369a1",
                            }}
                          >
                            {eventAchievements.length}{" "}
                            {eventAchievements.length === 1 ? "achievement" : "achievements"}
                          </span>
                        ) : null}
                      </div>
                      {metaParts.length > 0 ? (
                        <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                          {metaParts.join(" · ")}
                        </p>
                      ) : null}
                      <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                        <span style={{ fontWeight: 600, color: "#475569" }}>Team: </span>
                        {event.teamName ?? "No team yet"}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#64748b",
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s ease",
                      }}
                    >
                      ▾
                    </span>
                  </div>
                </button>

                {isExpanded ? (
                  <div
                    style={{
                      padding: "0 14px 14px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="pt-3" style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      Achievements
                    </p>

                    {achievementsError ? (
                      <p style={{ marginTop: 10, fontSize: 13, color: "#991b1b" }}>
                        Failed to load achievements for this event.
                      </p>
                    ) : eventAchievements.length === 0 ? (
                      <p style={{ marginTop: 10, fontSize: 13, color: "#8891a5" }}>
                        No achievements yet for this competition.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {eventAchievements.map((achievement) => (
                          <AchievementRow
                            key={`${achievement.type}-${achievement.id}`}
                            achievement={achievement}
                            onOpenCertificate={openCertificate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
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
