"use client";

import { useState } from "react";
import Link from "next/link";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";
import { useCriteriaTemplates } from "@/features/admin/hooks/use-admin-criteria";
import { useSystemConfig } from "@/features/admin/hooks/use-admin-system";
import { eventApi } from "@/lib/api/event.api";
import type { ScoringTemplateResponse } from "@/lib/api";
import { getEventEndDate, getPrizeLabel, getRoundWeightTotal } from "@/features/admin/utils/event-wizard.utils";
import {
  buildPublishPayload,
  isPartialPublishFailure,
  publishEvent,
  validatePublishReadiness,
  type PartialPublishFailure,
} from "@/features/admin/utils/event-publish.utils";
import { useRouter } from "next/navigation";

const sectionStyle: React.CSSProperties = { padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8, marginBottom: 12 };
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#0e1528", marginBottom: 8 };
const fieldStyle: React.CSSProperties = { fontSize: 13, color: "#4a5468", marginBottom: 4 };

export function Step7Preview({ onBack }: { onBack: () => void }) {
  const { data, reset } = useEventWizardStore();
  const { data: systemConfig } = useSystemConfig();
  const { data: templates = [] } = useCriteriaTemplates();
  const allTemplates = templates as ScoringTemplateResponse[];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialFailure, setPartialFailure] = useState<PartialPublishFailure | null>(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const router = useRouter();

  const totalRoundWeight = getRoundWeightTotal(data.rounds);
  const isRoundWeightValid = data.rounds.length <= 1 || totalRoundWeight === 100;
  const judgeValidationError = validatePublishReadiness(data);
  const canPublish = isRoundWeightValid && !judgeValidationError;

  const getTemplateName = (id: string | null) => {
    if (!id) return "—";
    return allTemplates.find((t) => t.id === id)?.name ?? "Unknown";
  };

  const handleCleanupPartialEvent = async () => {
    if (!partialFailure) return;
    setIsCleaningUp(true);
    setError(null);
    try {
      await eventApi.delete(partialFailure.eventId);
      setPartialFailure(null);
      setError("Draft event removed. You can fix the issues above and publish again.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete the draft event.");
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handlePublish = async () => {
    if (!isRoundWeightValid) {
      setError(`Total round weight must equal 100%. Currently: ${totalRoundWeight}%`);
      return;
    }

    const readinessError = validatePublishReadiness(data);
    if (readinessError) {
      setError(readinessError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPartialFailure(null);

    try {
      const payload = buildPublishPayload(data, systemConfig);
      await publishEvent(payload);
      reset();
      router.push("/admin/hackathons");
    } catch (err: unknown) {
      if (isPartialPublishFailure(err)) {
        setPartialFailure(err);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to publish event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 7: Preview & Publish</h2>

      {!isRoundWeightValid && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
          Total round weight must equal 100% before publishing. Currently: {totalRoundWeight}%
        </div>
      )}

      {judgeValidationError && (
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
          {judgeValidationError} Go back to Step 2 to assign at least one judge.
        </div>
      )}

      {partialFailure && (
        <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#9a3412" }}>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Event created partially</p>
          <p style={{ marginBottom: 8 }}>
            &quot;{partialFailure.eventName}&quot; was saved but publishing did not finish: {partialFailure.message}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/hackathons/${partialFailure.eventId}`}
              style={{ fontSize: 13, fontWeight: 600, color: "#c2410c", textDecoration: "underline" }}
            >
              Open event to review or finish setup
            </Link>
            <button
              type="button"
              onClick={handleCleanupPartialEvent}
              disabled={isCleaningUp}
              className="rounded-lg"
              style={{
                backgroundColor: "#ffffff",
                padding: "6px 14px",
                color: "#9a3412",
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid #fdba74",
                cursor: isCleaningUp ? "not-allowed" : "pointer",
                opacity: isCleaningUp ? 0.7 : 1,
              }}
            >
              {isCleaningUp ? "Removing..." : "Delete draft event"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div style={sectionStyle}>
        <p style={sectionTitle}>Event Info</p>
        <p style={fieldStyle}><strong>Name:</strong> {data.name}</p>
        <p style={fieldStyle}><strong>Season:</strong> {data.season} {data.year}</p>
        <p style={fieldStyle}><strong>Description:</strong> {data.description || "—"}</p>
        <p style={fieldStyle}><strong>Location:</strong> {data.location || "—"}</p>
        <p style={fieldStyle}><strong>Format:</strong> {data.format}</p>
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Tracks ({data.tracks.length})</p>
        {data.tracks.map((t, i) => (
          <div key={i} style={{ ...fieldStyle, marginBottom: 6 }}>
            <span>{t.name} — max {t.maxTeams} teams</span>
            {!data.applyToAllTracks && t.scoringTemplateId && (
              <span style={{ marginLeft: 8, fontSize: 12, color: "#0284c7" }}>
                Template: {getTemplateName(t.scoringTemplateId)}
              </span>
            )}
          </div>
        ))}
        {data.applyToAllTracks && data.scoringTemplateId && (
          <p style={{ fontSize: 12, color: "#0284c7", marginTop: 4 }}>
            Shared template: {getTemplateName(data.scoringTemplateId)}
          </p>
        )}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Staff</p>
        <p style={fieldStyle}><strong>Mentors:</strong> {data.mentorUserIds.length}</p>
        <p style={fieldStyle}><strong>Judges:</strong> {data.judgeUserIds.length}</p>
        {data.lecturerAssignments.map((a) => (
          <p key={a.userId} style={fieldStyle}>{a.fullName} — {a.role}</p>
        ))}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Timeline</p>
        <p style={fieldStyle}><strong>Start:</strong> {data.startDate} ({data.duration} days)</p>
        <p style={fieldStyle}><strong>Registration:</strong> {data.registrationOpenDate} to {data.registrationDeadline}</p>
        {data.semesterMin != null && data.semesterMax != null && (
          <p style={fieldStyle}><strong>Semester:</strong> {data.semesterMin}—{data.semesterMax}</p>
        )}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>
          Rounds ({data.rounds.length}) — Total weight:{" "}
          <span style={{ color: isRoundWeightValid ? "#10b981" : "#ef4444" }}>{totalRoundWeight}%</span>
        </p>
        {data.rounds.map((r, i) => (
          <p key={i} style={fieldStyle}>
            Round {i + 1}: {r.name} · {r.roundWeight}% · top {r.advancementCutoff} advance
          </p>
        ))}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Rules & Teams</p>
        <p style={fieldStyle}><strong>Min Teams:</strong> {systemConfig?.minTeams ?? "—"}</p>
        <p style={fieldStyle}><strong>Max Teams:</strong> {systemConfig?.maxTeams ?? "—"}</p>
        <p style={fieldStyle}><strong>Tiebreaker:</strong> {data.tiebreakerCriteria || "—"}</p>
      </div>

      {data.prizes.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitle}>
            Prizes ({data.prizes.length}) — {data.applyPrizesToAllTracks ? "Equal across tracks" : "Custom per track"}
          </p>
          {data.prizes.map((p, i) => (
            <p key={i} style={fieldStyle}>
              {p.trackIndex != null
                ? `[${data.tracks[p.trackIndex]?.name ?? `Track ${p.trackIndex + 1}`}] `
                : "[All tracks] "}
              {getPrizeLabel(p.rank, p.label)}: {p.value} × {p.quantity}
            </p>
          ))}
        </div>
      )}

      {data.honoredGuests.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitle}>Honored Guests ({data.honoredGuests.length})</p>
          {data.honoredGuests.map((g, i) => (
            <p key={i} style={fieldStyle}>{g.fullName}{g.title ? ` — ${g.title}` : ""}</p>
          ))}
        </div>
      )}

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>
          Back
        </button>
        <button
          onClick={handlePublish}
          disabled={isSubmitting || !canPublish}
          className="rounded-lg"
          style={{
            backgroundColor: canPublish ? "#10b981" : "#9ca3af",
            padding: "10px 32px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none",
            cursor: canPublish && !isSubmitting ? "pointer" : "not-allowed",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Publishing..." : "Publish Event"}
        </button>
      </div>
    </div>
  );
}
