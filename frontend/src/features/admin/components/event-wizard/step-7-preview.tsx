"use client";

import { useState } from "react";
import { useEventWizardStore } from "@/features/admin/store/event-wizard.store";
import { useCriteriaTemplates } from "@/features/admin/hooks/use-admin-criteria";
import { eventApi } from "@/lib/api/event.api";
import type { ScoringTemplateResponse } from "@/lib/api";
import { useRouter } from "next/navigation";

const sectionStyle: React.CSSProperties = { padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8, marginBottom: 12 };
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: "#0e1528", marginBottom: 8 };
const fieldStyle: React.CSSProperties = { fontSize: 13, color: "#4a5468", marginBottom: 4 };

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function Step7Preview({ onBack }: { onBack: () => void }) {
  const { data, reset } = useEventWizardStore();
  const { data: templates = [] } = useCriteriaTemplates();
  const allTemplates = templates as ScoringTemplateResponse[];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getTemplateName = (id: string | null) => {
    if (!id) return "—";
    return allTemplates.find((t) => t.id === id)?.name ?? "Unknown";
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const endDate = data.startDate ? addDays(data.startDate, data.duration - 1) : data.startDate;
      await eventApi.create({
        name: data.name,
        season: data.season,
        year: data.year,
        startDate: data.startDate,
        endDate,
        registrationDeadline: data.registrationDeadline,
        registrationOpenDate: data.registrationOpenDate || undefined,
        description: data.description || undefined,
        location: data.location || undefined,
        format: data.format,
        minTeam: data.minTeam ?? undefined,
        maxTeam: data.maxTeam ?? undefined,
        semesterMin: data.semesterMin ?? undefined,
        semesterMax: data.semesterMax ?? undefined,
        scoringTemplateId: data.scoringTemplateId ?? undefined,
        tiebreakerCriteria: data.tiebreakerCriteria || undefined,
        tracks: data.tracks.map((t) => ({
          name: t.name,
          description: t.description || undefined,
          maxTeams: t.maxTeams,
          scoringTemplateId: data.applyToAllTracks
            ? undefined
            : t.scoringTemplateId ?? undefined,
        })),
        prizes: data.prizes.map((p) => ({
          rank: p.rank,
          value: p.value,
          quantity: p.quantity,
          trackId: p.trackId,
        })),
        honoredGuests: data.honoredGuests.map((g) => ({
          fullName: g.fullName,
          title: g.title || undefined,
        })),
      });
      reset();
      router.push("/admin/hackathons");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 7: Preview & Publish</h2>

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
        <p style={sectionTitle}>Timeline</p>
        <p style={fieldStyle}><strong>Start:</strong> {data.startDate} ({data.duration} days)</p>
        <p style={fieldStyle}><strong>Registration:</strong> {data.registrationOpenDate} to {data.registrationDeadline}</p>
        {data.semesterMin && data.semesterMax && (
          <p style={fieldStyle}><strong>Semester:</strong> {data.semesterMin}—{data.semesterMax}</p>
        )}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Rounds ({data.rounds.length})</p>
        {data.rounds.map((r, i) => (
          <p key={i} style={fieldStyle}>Round {i + 1}: {r.name} (top {r.advancementCutoff} advance)</p>
        ))}
      </div>

      <div style={sectionStyle}>
        <p style={sectionTitle}>Rules & Teams</p>
        <p style={fieldStyle}><strong>Min Teams:</strong> {data.minTeam ?? "—"}</p>
        <p style={fieldStyle}><strong>Max Teams:</strong> {data.maxTeam ?? "—"}</p>
      </div>

      {data.prizes.length > 0 && (
        <div style={sectionStyle}>
          <p style={sectionTitle}>Prizes ({data.prizes.length})</p>
          {data.prizes.map((p, i) => (
            <p key={i} style={fieldStyle}>{p.rank}: {p.value} (x{p.quantity})</p>
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
          disabled={isSubmitting}
          className="rounded-lg"
          style={{ backgroundColor: "#10b981", padding: "10px 32px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "Publishing..." : "Publish Event"}
        </button>
      </div>
    </div>
  );
}
