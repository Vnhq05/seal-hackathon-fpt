"use client";

import { useState } from "react";
import { useMyAchievements } from "@/features/profile/hooks/use-my-achievements";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { AchievementCertificateDialog } from "@/features/profile/components/achievement-certificate-dialog";
import {
  buildCertificateData,
  formatAchievementPrize,
} from "@/features/profile/utils/build-certificate-data";
import type { UserAchievement } from "@/lib/api/admin-user.api";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";

const RANKING_LABELS = {
  FIRST: "1st Place",
  SECOND: "2nd Place",
  THIRD: "3rd Place",
  CONSOLATION: "Consolation",
} as const;

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

export function ProfileAchievements() {
  const { data: achievements = [], isLoading, isError } = useMyAchievements();
  const { data: profile } = useProfile();
  const [certificate, setCertificate] = useState<CertificateTemplateData | null>(null);

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
        <p style={{ fontSize: 14, color: "#991b1b", textAlign: "center" }}>
          Failed to load your events. Please try again.
        </p>
      </Card>
    );
  }

  if (achievements.length === 0) {
    return (
      <Card>
        <p style={{ fontSize: 14, color: "#8891a5", textAlign: "center" }}>
          Your events will appear here once you complete a hackathon.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>Achievements</h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {achievements.length} {achievements.length === 1 ? "achievement" : "achievements"}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {achievements.map((achievement) => {
            const isAward = achievement.type === "TEAM_AWARD";
            const prize = formatAchievementPrize(achievement);

            return (
              <article
                key={`${achievement.type}-${achievement.id}`}
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
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>
                      {achievement.eventName || "Hackathon"}
                    </h4>
                    <time style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(achievement.achievedAt).toLocaleDateString()}
                    </time>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                    <p style={{ fontSize: 12, color: "#64748b" }}>
                      <span style={{ fontWeight: 600, color: "#475569" }}>Prize: </span>
                      <span style={{ color: isAward ? "#b45309" : "#0369a1", fontWeight: 700 }}>
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
                    {achievement.prizeRank && (
                      <p style={{ fontSize: 12, color: "#64748b" }}>
                        <span style={{ fontWeight: 600, color: "#475569" }}>Ranking: </span>
                        {RANKING_LABELS[achievement.prizeRank]}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => openCertificate(achievement)}
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
