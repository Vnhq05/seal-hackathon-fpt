"use client";

import { useMemo, useState } from "react";
import type { EventResponse, RoundResponse, ScoringTemplateResponse } from "@/lib/api";
import {
  useAdminRounds,
  useCreateRound,
  useDeleteRound,
} from "@/features/admin/hooks/use-admin-rounds";
import { useUpdateEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminTracks, useUpdateTrack } from "@/features/admin/hooks/use-admin-tracks";
import { useCriteriaTemplates } from "@/features/admin/hooks/use-admin-criteria";
import {
  formatRoundDateTime,
  getRoundWarnings,
} from "@/features/admin/utils/event-wizard.utils";
import {
  bannerErrorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
  mergeEventUpdate,
  toDateInput,
  warnBoxStyle,
} from "@/features/admin/components/event-edit/event-edit.utils";

function toDateTimeLocalBounds(date: string, endOfDay = false): string | undefined {
  if (!date) return undefined;
  return endOfDay ? `${date}T23:59` : `${date}T00:00`;
}

function toApiDateTime(value: string): string {
  if (!value) return value;
  if (value.length === 16) return `${value}:00`;
  if (value.length === 19) return value;
  return `${value}T00:00:00`;
}

function TemplateCriteriaPreview({ template }: { template: ScoringTemplateResponse }) {
  const totalWeight = template.criteria.reduce((sum, c) => sum + c.weight, 0);
  return (
    <div style={{ padding: 12, backgroundColor: "#f8f9fc", borderRadius: 8, marginTop: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1528" }}>{template.name}</p>
        <p style={{ fontSize: 12, fontWeight: 700, color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>
          Total: {totalWeight}%
        </p>
      </div>
      {template.criteria.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between"
          style={{ padding: "4px 0", borderBottom: "1px solid rgba(223,226,236,0.3)" }}
        >
          <span style={{ fontSize: 12, color: "#0e1528" }}>{c.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5468" }}>{c.weight}%</span>
        </div>
      ))}
    </div>
  );
}

function TemplateSelect({
  value,
  onChange,
  templates,
  isLoading,
  disabled,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  templates: ScoringTemplateResponse[];
  isLoading: boolean;
  disabled?: boolean;
}) {
  if (isLoading) {
    return <div className="animate-pulse rounded" style={{ height: 44, backgroundColor: "rgba(223,226,236,0.8)" }} />;
  }
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      style={inputStyle}
    >
      <option value="">Select a template...</option>
      {templates.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  );
}

function ScoringSection({ event }: { event: EventResponse }) {
  const editable = isEventEditable(event.status);
  const eventId = event.id;
  const { data: tracks = [] } = useAdminTracks(eventId);
  const { data: templates = [], isLoading, isError } = useCriteriaTemplates();
  const allTemplates = templates as ScoringTemplateResponse[];
  const { mutate: updateEvent, isPending: savingEvent } = useUpdateEvent();
  const { mutate: updateTrack, isPending: savingTrack } = useUpdateTrack(eventId);

  const initialApplyAll = useMemo(() => {
    if (event.scoringTemplateId) return true;
    const trackTemplates = tracks.map((t) => t.scoringTemplateId).filter(Boolean);
    if (trackTemplates.length === 0) return true;
    return new Set(trackTemplates).size === 1 && trackTemplates.length === tracks.length;
  }, [event.scoringTemplateId, tracks]);

  const [applyToAllTracks, setApplyToAllTracks] = useState(initialApplyAll);
  const [scoringTemplateId, setScoringTemplateId] = useState<string | null>(event.scoringTemplateId);
  const tracksKey = tracks.map((t) => `${t.id}:${t.scoringTemplateId}`).join("|");
  const [trackTemplateIds, setTrackTemplateIds] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(tracks.map((t) => [t.id, t.scoringTemplateId])),
  );
  const [prevTracksKey, setPrevTracksKey] = useState(tracksKey);
  const [tiebreakerIds, setTiebreakerIds] = useState<string[]>(event.tiebreakerCriterionIds ?? []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (tracksKey !== prevTracksKey) {
    setPrevTracksKey(tracksKey);
    setTrackTemplateIds(Object.fromEntries(tracks.map((t) => [t.id, t.scoringTemplateId])));
  }

  const selectedSharedTemplate = allTemplates.find((t) => t.id === scoringTemplateId);
  const activeTemplate = applyToAllTracks
    ? selectedSharedTemplate
    : allTemplates.find((t) => t.id === trackTemplateIds[tracks[0]?.id ?? ""]);

  const syncTiebreakerFromTemplate = (template: ScoringTemplateResponse | undefined) => {
    if (!template) return;
    const defaultIds = [...template.criteria]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);
    setTiebreakerIds(defaultIds);
  };

  const moveTiebreaker = (index: number, direction: -1 | 1) => {
    const ids = [...tiebreakerIds];
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setTiebreakerIds(ids);
  };

  const handleSaveScoring = () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (applyToAllTracks) {
      if (!scoringTemplateId) {
        setSaveError("Please select a scoring template");
        return;
      }
      const names = tiebreakerIds
        .map((id) => selectedSharedTemplate?.criteria.find((c) => c.id === id)?.name)
        .filter(Boolean);
      updateEvent(
        {
          eventId,
          ...mergeEventUpdate(event, {
            scoringTemplateId,
            tiebreakerCriterionIds: tiebreakerIds,
            tiebreakerCriteria: names.join(", "),
          }),
        },
        {
          onSuccess: () => setSaveSuccess(true),
          onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save scoring"),
        },
      );
    } else {
      if (tracks.some((t) => !trackTemplateIds[t.id])) {
        setSaveError("Each track must have a scoring template assigned");
        return;
      }
      const names = tiebreakerIds
        .map((id) => activeTemplate?.criteria.find((c) => c.id === id)?.name)
        .filter(Boolean);
      let pending = tracks.length;
      let failed = false;
      tracks.forEach((track) => {
        updateTrack(
          {
            trackId: track.id,
            name: track.name,
            description: track.description ?? undefined,
            maxTeams: track.maxTeams,
            scoringTemplateId: trackTemplateIds[track.id] ?? undefined,
          },
          {
            onSuccess: () => {
              pending -= 1;
              if (pending === 0 && !failed) {
                updateEvent(
                  {
                    eventId,
                    ...mergeEventUpdate(event, {
                      scoringTemplateId: undefined,
                      tiebreakerCriterionIds: tiebreakerIds,
                      tiebreakerCriteria: names.join(", "),
                    }),
                  },
                  {
                    onSuccess: () => setSaveSuccess(true),
                    onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save tiebreaker"),
                  },
                );
              }
            },
            onError: (err) => {
              failed = true;
              setSaveError(err instanceof Error ? err.message : "Failed to save track template");
            },
          },
        );
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Scoring Rubric</h2>

      {isError && (
        <div style={{ padding: 12, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
          Could not load scoring templates from admin configuration. Refresh the page or contact an administrator.
        </div>
      )}

      {!isLoading && !isError && allTemplates.length === 0 && (
        <div style={{ padding: 12, backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
          No scoring templates configured yet. Ask an administrator to create templates in Criteria settings.
        </div>
      )}

      <div>
        <label style={labelStyle}>Scoring Mode</label>
        <div className="flex gap-3" style={{ marginTop: 6 }}>
          <button
            type="button"
            disabled={!editable}
            onClick={() => setApplyToAllTracks(true)}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: applyToAllTracks ? "2px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: applyToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: editable ? "pointer" : "not-allowed",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>Shared Template</p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>All tracks use the same scoring criteria</p>
          </button>
          <button
            type="button"
            disabled={!editable}
            onClick={() => setApplyToAllTracks(false)}
            style={{
              flex: 1,
              padding: "14px 16px",
              borderRadius: 10,
              border: !applyToAllTracks ? "2px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: !applyToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: editable ? "pointer" : "not-allowed",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>Per-Track Template</p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>Each track has its own scoring criteria</p>
          </button>
        </div>
      </div>

      {applyToAllTracks ? (
        <div>
          <label style={labelStyle}>Scoring Template</label>
          <TemplateSelect
            value={scoringTemplateId}
            onChange={(id) => {
              setScoringTemplateId(id);
              syncTiebreakerFromTemplate(allTemplates.find((t) => t.id === id));
            }}
            templates={allTemplates}
            isLoading={isLoading}
            disabled={!editable}
          />
          {selectedSharedTemplate && <TemplateCriteriaPreview template={selectedSharedTemplate} />}
        </div>
      ) : tracks.length === 0 ? (
        <div style={{ padding: 16, backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
          No tracks configured. Add tracks first.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tracks.map((track) => {
            const trackTemplate = allTemplates.find((t) => t.id === trackTemplateIds[track.id]);
            return (
              <div key={track.id} style={{ padding: 16, backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderRadius: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{track.name}</p>
                <TemplateSelect
                  value={trackTemplateIds[track.id] ?? null}
                  onChange={(id) => {
                    setTrackTemplateIds((prev) => ({ ...prev, [track.id]: id }));
                    if (track.id === tracks[0]?.id && id) {
                      syncTiebreakerFromTemplate(allTemplates.find((t) => t.id === id));
                    }
                  }}
                  templates={allTemplates}
                  isLoading={isLoading}
                  disabled={!editable}
                />
                {trackTemplate && <TemplateCriteriaPreview template={trackTemplate} />}
              </div>
            );
          })}
        </div>
      )}

      {activeTemplate && tiebreakerIds.length > 0 && (
        <div style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 10 }}>
          <label style={labelStyle}>Tiebreaker priority (first wins ties)</label>
          <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
            {tiebreakerIds.map((id, index) => {
              const criterion = activeTemplate.criteria.find((c) => c.id === id);
              if (!criterion) return null;
              return (
                <div key={id} className="flex items-center justify-between gap-2" style={{ padding: "8px 12px", backgroundColor: "#fff", borderRadius: 6 }}>
                  <span style={{ fontSize: 14 }}>{index + 1}. {criterion.name}</span>
                  <div className="flex gap-1">
                    <button type="button" disabled={!editable || index === 0} onClick={() => moveTiebreaker(index, -1)} style={{ padding: "4px 8px", fontSize: 12 }}>↑</button>
                    <button type="button" disabled={!editable || index === tiebreakerIds.length - 1} onClick={() => moveTiebreaker(index, 1)} style={{ padding: "4px 8px", fontSize: 12 }}>↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {saveError && <div style={bannerErrorStyle}>{saveError}</div>}
      {saveSuccess && (
        <div style={{ ...bannerErrorStyle, color: "#166534", backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }}>
          Scoring saved successfully.
        </div>
      )}

      <button
        type="button"
        onClick={handleSaveScoring}
        disabled={!editable || savingEvent || savingTrack}
        className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
      >
        {savingEvent || savingTrack ? "Saving..." : "Save Scoring"}
      </button>
    </div>
  );
}

export function AddRoundsTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);
  const eventEnd = toDateInput(event.endDate);
  const eventStart = toDateInput(event.startDate);
  const roundMinDt = toDateTimeLocalBounds(eventStart);
  const roundMaxDt = toDateTimeLocalBounds(eventEnd, true);

  const { data: rounds = [], isLoading } = useAdminRounds(eventId);
  const { mutate: createRound, isPending: creating } = useCreateRound(eventId);
  const { mutate: deleteRound, isPending: deleting } = useDeleteRound(eventId);

  const [roundName, setRoundName] = useState("");
  const [roundStart, setRoundStart] = useState("");
  const [roundEnd, setRoundEnd] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [roundCutoff, setRoundCutoff] = useState(1);
  const [minJudgesPerRound, setMinJudgesPerRound] = useState(2);
  const [addRoundErrors, setAddRoundErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const draftRounds = rounds.map((r) => ({
    name: r.name,
    startDate: r.startDate,
    endDate: r.endDate,
    advancementCutoff: r.advancementCutoff,
    roundWeight: r.roundWeight ?? 100,
  }));

  const handleAddRound = () => {
    const errors: string[] = [];
    if (!roundName.trim()) errors.push("Round name is required");
    if (!roundStart) errors.push("Round start is required");
    if (!roundEnd) errors.push("Round end is required");
    if (!submissionDeadline) errors.push("Submission deadline is required");
    if (roundStart && roundEnd && roundStart >= roundEnd) errors.push("Round end must be after start");

    setAddRoundErrors(errors);
    if (errors.length > 0) return;

    setActionError(null);
    const resolvedStart = toApiDateTime(roundStart);
    const resolvedEnd = toApiDateTime(roundEnd);
    const resolvedSubmissionDeadline = toApiDateTime(submissionDeadline);

    createRound(
      {
        roundNumber: rounds.length + 1,
        name: roundName.trim(),
        startDate: resolvedStart,
        endDate: resolvedEnd,
        submissionDeadline: resolvedSubmissionDeadline,
        scoringDeadline: resolvedEnd,
        advancementCutoff: roundCutoff,
        minJudgesPerRound,
      },
      {
        onSuccess: () => {
          setRoundName("");
          setRoundStart("");
          setRoundEnd("");
          setSubmissionDeadline("");
          setRoundCutoff(1);
          setMinJudgesPerRound(2);
          setAddRoundErrors([]);
        },
        onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to add round"),
      },
    );
  };

  const handleRemoveRound = (round: RoundResponse) => {
    setActionError(null);
    deleteRound(round.id, {
      onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to remove round"),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      {!editable && (
        <div style={bannerErrorStyle}>
          Rounds cannot be modified while the event is active or completed.
        </div>
      )}

      <div className="flex flex-col gap-4 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Rounds</h2>

        <div className="flex flex-col gap-4" style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8 }}>
          <div className="flex flex-col">
            <label style={labelStyle}>Round Name</label>
            <input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              disabled={!editable}
              style={inputStyle}
              placeholder="e.g. Qualifying Round"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label style={labelStyle}>Start Date & Time</label>
              <input
                type="datetime-local"
                value={roundStart}
                onChange={(e) => setRoundStart(e.target.value)}
                disabled={!editable}
                style={inputStyle}
                min={roundMinDt}
                max={roundMaxDt}
              />
            </div>
            <div className="flex flex-col">
              <label style={labelStyle}>End Date & Time</label>
              <input
                type="datetime-local"
                value={roundEnd}
                onChange={(e) => setRoundEnd(e.target.value)}
                disabled={!editable}
                style={inputStyle}
                min={roundMinDt}
                max={roundMaxDt}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>Submission Deadline</label>
            <input
              type="datetime-local"
              value={submissionDeadline}
              onChange={(e) => setSubmissionDeadline(e.target.value)}
              disabled={!editable}
              style={inputStyle}
              min={roundMinDt}
              max={roundMaxDt}
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>Top N Advance</label>
            <input
              type="number"
              value={roundCutoff}
              onChange={(e) => setRoundCutoff(parseInt(e.target.value, 10) || 1)}
              disabled={!editable}
              style={inputStyle}
              min={1}
              placeholder="e.g. 10"
            />
          </div>

          <div className="flex flex-col">
            <label style={labelStyle}>Min judges per scope</label>
            <input
              type="number"
              value={minJudgesPerRound}
              onChange={(e) => setMinJudgesPerRound(parseInt(e.target.value, 10) || 2)}
              disabled={!editable}
              style={inputStyle}
              min={1}
              max={20}
              placeholder="e.g. 2"
            />
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
              Minimum active judges required per track/group before scoring can start.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRound}
            disabled={!editable || creating}
            className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
          >
            {creating ? "Adding..." : "Add Round"}
          </button>

          {addRoundErrors.length > 0 && (
            <div style={warnBoxStyle}>
              {addRoundErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="animate-pulse rounded" style={{ height: 60, backgroundColor: "rgba(223,226,236,0.8)" }} />
        ) : (
          rounds.map((r, idx) => {
            const draft = draftRounds[idx];
            const warnings = getRoundWarnings(draft, eventStart, eventEnd, idx > 0 ? draftRounds[idx - 1] : null);
            const hasWarning = warnings.length > 0;
            return (
              <div
                key={r.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor: hasWarning ? "#fef2f2" : "#ffffff",
                  border: `1px solid ${hasWarning ? "#fecaca" : "rgba(223,226,236,0.5)"}`,
                  borderRadius: 6,
                  marginBottom: 4,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      Round {r.roundNumber}: {r.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#8891a5", marginLeft: 12 }}>
                      Top {r.advancementCutoff} advance · Min {r.minJudgesPerRound ?? 2} judges/scope
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(r)}
                    disabled={!editable || deleting}
                    style={{ color: "#991b1b", background: "none", border: "none", cursor: editable ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
                  {formatRoundDateTime(r.startDate)} → {formatRoundDateTime(r.endDate)}
                </p>
                {warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: 12, color: "#991b1b", marginTop: 2 }}>⚠ {w}</p>
                ))}
              </div>
            );
          })
        )}

        {actionError && <div style={bannerErrorStyle}>{actionError}</div>}
      </div>

      <ScoringSection event={event} />
    </div>
  );
}
