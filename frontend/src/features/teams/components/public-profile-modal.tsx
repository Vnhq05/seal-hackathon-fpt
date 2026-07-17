"use client";

import { useEffect, useState } from "react";
import type { PublicMatchingProfileResponse } from "@/lib/api/matching.api";
import { resolveFileUrl } from "@/lib/files";
import { formatUniversityDisplay } from "@/lib/university";

const USER_TYPE_LABELS = {
  SYSTEM_ADMIN: "Admin",
  FPT_STUDENT: "FPT Student",
  EXTERNAL_STUDENT: "External Student",
  LECTURER: "Lecturer",
  EVENT_COORDINATOR: "Coordinator",
} as const;

const USER_TYPE_COLORS = {
  SYSTEM_ADMIN: { backgroundColor: "#fef3c7", color: "#92400e" },
  FPT_STUDENT: { backgroundColor: "#eff6ff", color: "#1e40af" },
  EXTERNAL_STUDENT: { backgroundColor: "#f5f3ff", color: "#5b21b6" },
  LECTURER: { backgroundColor: "#fdf4ff", color: "#86198f" },
  EVENT_COORDINATOR: { backgroundColor: "#fce7f3", color: "#9d174d" },
} as const;

function formatTeamRank(finalRank: number | null): string {
  if (finalRank == null) return "Unranked";
  return `Rank #${finalRank}`;
}

interface PublicProfileModalProps {
  profile: PublicMatchingProfileResponse;
  loading?: boolean;
  error?: Error | null;
  onClose: () => void;
}

export function PublicProfileModal({ profile, loading, error, onClose }: PublicProfileModalProps) {
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const avatarSrc = resolveFileUrl(profile.avatarUrl);
  const initial = profile.fullName.trim().charAt(0).toUpperCase();
  const details = [
    { label: "Email", value: profile.email || "—" },
    { label: "Phone", value: profile.phone || "—" },
    { label: "Student ID", value: profile.studentId || "—" },
    {
      label: "School",
      value: formatUniversityDisplay(profile.userType ?? "FPT_STUDENT", profile.universityName),
    },
    { label: "Student standing", value: profile.studentStanding?.replaceAll("_", " ") || "—" },
    { label: "Semester", value: profile.semester?.toString() || "—" },
    { label: "Account type", value: profile.temporaryAccount ? "Temporary" : "Official" },
    {
      label: "Joined",
      value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—",
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowAvatarPreview((isPreviewOpen) => {
        if (!isPreviewOpen) onClose();
        return false;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-profile-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
        style={{ border: "1px solid rgba(198,198,205,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close public profile"
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 18, border: 0, background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 24, lineHeight: 1 }}
        >
          ×
        </button>

        <div className="flex items-center gap-3" style={{ paddingRight: 32 }}>
          {avatarSrc ? (
            <button
              type="button"
              onClick={() => setShowAvatarPreview(true)}
              className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
              style={{
                backgroundImage: `url("${avatarSrc}")`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                border: "2px solid #e0f2fe",
                padding: 0,
                cursor: "zoom-in",
              }}
              aria-label={`View ${profile.fullName}'s avatar in full size`}
              title="Click to enlarge"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: 18, fontWeight: 700 }}
            >
              {initial}
            </div>
          )}
          <div>
            <h2 id="public-profile-title" style={{ fontSize: 20, fontWeight: 700, color: "#0e1528" }}>
              {profile.fullName}
            </h2>
            {profile.userType && (
              <span
                className="mt-1 inline-flex rounded-full px-2 py-1"
                style={{ fontSize: 12, fontWeight: 600, ...USER_TYPE_COLORS[profile.userType] }}
              >
                {USER_TYPE_LABELS[profile.userType]}
              </span>
            )}
          </div>
        </div>

        <dl
          className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2"
          style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 20 }}
        >
          {details.map((detail) => (
            <div key={detail.label}>
              <dt style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>{detail.label}</dt>
              <dd style={{ marginTop: 3, fontSize: 14, color: "#0e1528", overflowWrap: "anywhere" }}>
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>

        <section style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>Achievements</h3>
            {!loading && (
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {profile.competitions.length} {profile.competitions.length === 1 ? "achievement" : "achievements"}
              </span>
            )}
          </div>

          {loading && (
            <div className="mt-3 space-y-2">
              {[0, 1].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          )}
          {error && (
            <p style={{ marginTop: 12, color: "#991b1b", fontSize: 13 }}>
              {error instanceof Error ? error.message : "Failed to load profile"}
            </p>
          )}
          {!loading && !error && profile.competitions.length === 0 && (
            <div style={{ marginTop: 12, padding: "20px 16px", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#64748b" }}>No achievements recorded yet.</p>
            </div>
          )}
          {!loading && !error && profile.competitions.length > 0 && (
            <div className="mt-3 space-y-2">
              {profile.competitions.map((item) => (
                <article
                  key={`${item.eventId}-${item.teamName}`}
                  className="flex gap-3"
                  style={{ padding: 14, border: "1px solid #bae6fd", backgroundColor: "#f0f9ff" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: 18 }}
                    aria-hidden="true"
                  >
                    ★
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>{item.eventName}</h4>
                      <time style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                        {item.achievedAt ? new Date(item.achievedAt).toLocaleDateString() : "—"}
                      </time>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                      <p style={{ fontSize: 12, color: "#64748b" }}>
                        <span style={{ fontWeight: 600, color: "#475569" }}>Ranking: </span>
                        {formatTeamRank(item.finalRank)}
                      </p>
                      <p style={{ fontSize: 12, color: "#64748b" }}>
                        <span style={{ fontWeight: 600, color: "#475569" }}>Team: </span>
                        {item.teamName || "—"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showAvatarPreview && avatarSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${profile.fullName}'s avatar (enlarged)`}
          onClick={(event) => {
            event.stopPropagation();
            setShowAvatarPreview(false);
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
          <button
            type="button"
            aria-label="Close avatar preview"
            onClick={(event) => {
              event.stopPropagation();
              setShowAvatarPreview(false);
            }}
            className="absolute right-6 top-5 z-10 border-0 bg-transparent text-3xl leading-none text-white"
          >
            ×
          </button>
          <div
            className="relative max-h-[85vh] max-w-[85vw] rounded-full border-4 border-white/85 shadow-2xl"
            style={{
              width: "min(70vh, 70vw, 480px)",
              aspectRatio: "1 / 1",
              backgroundImage: `url("${avatarSrc}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              cursor: "zoom-out",
            }}
            role="img"
            aria-label={`${profile.fullName}'s avatar`}
          />
        </div>
      )}
    </div>
  );
}
