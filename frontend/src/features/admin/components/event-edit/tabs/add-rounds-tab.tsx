"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { EventResponse, RoundResponse, ScoringTemplateResponse } from "@/lib/api";
import {
  useAdminRounds,
  useCreateRound,
  useDeleteRound,
} from "@/features/admin/hooks/use-admin-rounds";
import { useUpdateEvent } from "@/features/admin/hooks/use-admin-hackathons";
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
import {
  DEFAULT_MAX_SCORE,
  DEFAULT_MIN_SCORE,
  SCORE_SCALE_OPTIONS,
  type ScoreScaleMax,
  isScoreScaleMax,
} from "@/features/judging/constants/scoring-scale";

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

function isDefaultTemplate(template: ScoringTemplateResponse): boolean {
  return template.isDefault === true || template.name.toLowerCase() === "default";
}

function TemplateCriteriaPreview({
  template,
  scoreScaleMax,
}: {
  template: ScoringTemplateResponse;
  scoreScaleMax: ScoreScaleMax;
}) {
  const totalWeight = template.criteria.reduce((sum, c) => sum + c.weight, 0);
  const showDefault = isDefaultTemplate(template);
  return (
    <div style={{ padding: 12, backgroundColor: "#f8f9fc", borderRadius: 8, marginTop: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-2">
          {showDefault && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "#0c4a6e",
                backgroundColor: "#e0f2fe",
                border: "1px solid #7dd3fc",
                borderRadius: 4,
                padding: "2px 8px",
              }}
            >
              Default
            </span>
          )}
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1528" }}>{template.name}</p>
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: totalWeight === 100 ? "#10b981" : "#ef4444" }}>
          Total: {totalWeight}% · Scale {DEFAULT_MIN_SCORE}–{scoreScaleMax}
        </p>
      </div>
      {template.criteria.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between"
          style={{ padding: "4px 0", borderBottom: "1px solid rgba(223,226,236,0.3)" }}
        >
          <span style={{ fontSize: 12, color: "#0e1528" }}>{c.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5468" }}>
            {c.weight}% · {DEFAULT_MIN_SCORE}–{scoreScaleMax}
          </span>
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
  const ordered = [...templates].sort((a, b) => {
    const aDef = isDefaultTemplate(a) ? 0 : 1;
    const bDef = isDefaultTemplate(b) ? 0 : 1;
    return aDef - bDef;
  });
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      style={inputStyle}
    >
      <option value="">Select a template...</option>
      {ordered.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}{isDefaultTemplate(t) ? " (Default)" : ""}
        </option>
      ))}
    </select>
  );
}

function defaultBadgeStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: active ? "#0c4a6e" : "#64748b",
    backgroundColor: active ? "#e0f2fe" : "#f1f5f9",
    border: active ? "1px solid #7dd3fc" : "1px solid #e2e8f0",
    borderRadius: 4,
    padding: "2px 8px",
  };
}

function ScoringSection({ event }: { event: EventResponse }) {
  const editable = isEventEditable(event.status);
  const eventId = event.id;
  const { data: templates = [], isLoading, isError } = useCriteriaTemplates();
  const allTemplates = templates as ScoringTemplateResponse[];
  const { mutate: updateEvent, isPending: savingEvent } = useUpdateEvent();

  const defaultTemplate = useMemo(
    () => allTemplates.find(isDefaultTemplate) ?? null,
    [allTemplates],
  );

  const [scoringTemplateId, setScoringTemplateId] = useState<string | null>(event.scoringTemplateId);
  const [scoreScaleMax, setScoreScaleMax] = useState<ScoreScaleMax>(() => {
    const fromEvent = event.scoreScaleMax;
    return fromEvent != null && isScoreScaleMax(fromEvent) ? fromEvent : DEFAULT_MAX_SCORE;
  });
  const [tiebreakerIds, setTiebreakerIds] = useState<string[]>(event.tiebreakerCriterionIds ?? []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const syncTiebreakerFromTemplate = (template: ScoringTemplateResponse | undefined) => {
    if (!template) return;
    const defaultIds = [...template.criteria]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.id);
    setTiebreakerIds(defaultIds);
  };

  // Auto-select system Default when the event has no scoring template yet.
  useEffect(() => {
    if (!defaultTemplate) return;
    if (event.scoringTemplateId || scoringTemplateId) return;
    setScoringTemplateId(defaultTemplate.id);
    syncTiebreakerFromTemplate(defaultTemplate);
  }, [defaultTemplate, event.scoringTemplateId, scoringTemplateId]);

  const selectedTemplate = allTemplates.find((t) => t.id === scoringTemplateId);
  const isDefaultSelected = !!(selectedTemplate && isDefaultTemplate(selectedTemplate));

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

    if (!scoringTemplateId) {
      setSaveError("Please select a scoring template");
      return;
    }
    const names = tiebreakerIds
      .map((id) => selectedTemplate?.criteria.find((c) => c.id === id)?.name)
      .filter(Boolean);
    updateEvent(
      {
        eventId,
        ...mergeEventUpdate(event, {
          scoringTemplateId,
          scoreScaleMax,
          tiebreakerCriterionIds: tiebreakerIds,
          tiebreakerCriteria: names.join(", "),
        }),
      },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save scoring"),
      },
    );
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

      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: "2px solid #38bdf8",
          backgroundColor: "#f0f9ff",
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", margin: 0 }}>Shared Template</p>
          {isDefaultSelected && <span style={defaultBadgeStyle(true)}>Default</span>}
        </div>
        <p style={{ fontSize: 12, color: "#8891a5" }}>
          {isDefaultSelected
            ? "Using the Default rubric for all tracks"
            : "All tracks use the same scoring criteria"}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Scoring Template</label>
          {isDefaultSelected && <span style={defaultBadgeStyle(true)}>Default</span>}
        </div>
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
        {selectedTemplate && (
          <TemplateCriteriaPreview template={selectedTemplate} scoreScaleMax={scoreScaleMax} />
        )}
      </div>

      <div>
        <label style={labelStyle}>Score scale</label>
        <select
          value={scoreScaleMax}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (isScoreScaleMax(next)) setScoreScaleMax(next);
          }}
          disabled={!editable}
          style={inputStyle}
        >
          {SCORE_SCALE_OPTIONS.map((opt) => (
            <option key={opt.max} value={opt.max}>
              {opt.label} — {opt.description}
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: "#8891a5", marginTop: 6 }}>
          Default is 1–100. Applies to criteria on new rounds and remaps existing round criteria when saved.
        </p>
      </div>

      {selectedTemplate && tiebreakerIds.length > 0 && (
        <div style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 10 }}>
          <label style={labelStyle}>Tiebreaker priority (first wins ties)</label>
          <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
            {tiebreakerIds.map((id, index) => {
              const criterion = selectedTemplate.criteria.find((c) => c.id === id);
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
        disabled={!editable || savingEvent}
        className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
      >
        {savingEvent ? "Saving..." : "Save Scoring"}
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
        // Placeholder — advance slots are auto-computed from team counts (hidden config)
        advancementCutoff: 1,
        minJudgesPerRound,
      },
      {
        onSuccess: () => {
          setRoundName("");
          setRoundStart("");
          setRoundEnd("");
          setSubmissionDeadline("");
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
              Advance slots are calculated automatically from team counts (not entered here).
              The round with the latest end time is treated as Final.
            </p>
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
              Advance slots are calculated automatically from team counts (not entered here).
              The round with the latest end time is treated as Final.
            </p>
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
              Advance slots are calculated automatically from team counts (not entered here).
              The round with the latest end time is treated as Final.
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
                      {r.roundType === "FINAL"
                        ? "Final · uses previous round submission · "
                        : "Auto advance by group/track · "}
                      Min {r.minJudgesPerRound ?? 2} judges/scope
                      {r.roundType ? ` · ${r.roundType}` : ""}
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
