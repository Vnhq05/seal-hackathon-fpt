"use client";

import { useState } from "react";
import { useEventWizardStore, type WizardRound } from "@/features/admin/store/event-wizard.store";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };
const warnBoxStyle: React.CSSProperties = {
  backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
  padding: "6px 10px", fontSize: 12, color: "#991b1b", marginTop: 4,
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateTime(dt: string) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getEventEndDate(startDate: string, duration: number): string {
  return addDays(startDate, duration - 1);
}

function getRoundWarnings(
  round: WizardRound,
  eventStart: string,
  eventEnd: string,
  prevRound: WizardRound | null,
): string[] {
  const warnings: string[] = [];
  if (!eventStart || !eventEnd) return warnings;

  const eventStartDt = eventStart + "T00:00:00";
  const eventEndDt = eventEnd + "T23:59:59";

  if (round.startDate && round.startDate < eventStartDt) {
    warnings.push("Round start is before the event start date");
  }
  if (round.endDate && round.endDate > eventEndDt) {
    warnings.push("Round end is after the event end date");
  }
  if (round.startDate && round.endDate && round.startDate >= round.endDate) {
    warnings.push("Round end must be after round start");
  }
  if (prevRound && prevRound.endDate && round.startDate && round.startDate < prevRound.endDate) {
    warnings.push(`Overlaps with previous round "${prevRound.name}"`);
  }

  return warnings;
}

export function Step3Timeline({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roundName, setRoundName] = useState("");
  const [roundStart, setRoundStart] = useState("");
  const [roundEnd, setRoundEnd] = useState("");
  const [roundCutoff, setRoundCutoff] = useState(5);
  const [addRoundErrors, setAddRoundErrors] = useState<string[]>([]);

  const eventEnd = data.startDate ? getEventEndDate(data.startDate, data.duration) : "";

  const roundMinDt = data.startDate ? data.startDate + "T00:00" : undefined;
  const roundMaxDt = eventEnd ? eventEnd + "T23:59" : undefined;

  const addRound = () => {
    if (!roundName.trim() || !roundStart || !roundEnd) return;

    const errs: string[] = [];
    if (roundStart >= roundEnd) {
      errs.push("Round end must be after round start");
    }
    if (data.startDate && eventEnd) {
      const eventStartDt = data.startDate + "T00:00:00";
      const eventEndDt = eventEnd + "T23:59:59";
      if (roundStart < eventStartDt) errs.push("Round start is before the event start date");
      if (roundEnd > eventEndDt) errs.push("Round end is after the event end date");
    }
    const prevRound = data.rounds.length > 0 ? data.rounds[data.rounds.length - 1] : null;
    if (prevRound && prevRound.endDate && roundStart < prevRound.endDate) {
      errs.push(`Overlaps with previous round "${prevRound.name}"`);
    }

    if (errs.length > 0) {
      setAddRoundErrors(errs);
      return;
    }

    const newRound: WizardRound = {
      name: roundName.trim(),
      startDate: roundStart,
      endDate: roundEnd,
      judgeUserIds: [],
      advancementCutoff: roundCutoff,
    };
    updateData({ rounds: [...data.rounds, newRound] });
    setRoundName("");
    setRoundStart("");
    setRoundEnd("");
    setRoundCutoff(5);
    setAddRoundErrors([]);
  };

  const removeRound = (idx: number) => {
    updateData({ rounds: data.rounds.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.startDate) errs.startDate = "Start date is required";
    if (!data.registrationOpenDate) errs.registrationOpenDate = "Registration open date is required";
    if (!data.registrationDeadline) errs.registrationDeadline = "Registration close date is required";
    if (data.registrationOpenDate && data.registrationDeadline && data.registrationOpenDate >= data.registrationDeadline) {
      errs.registrationDeadline = "Registration close must be after open date";
    }
    if (data.registrationDeadline && data.startDate && data.registrationDeadline >= data.startDate) {
      errs.registrationDeadline = "Registration must close before event start date";
    }
    if (data.rounds.length < 1) errs.rounds = "At least 1 round is required";
    if (data.duration < 1 || data.duration > 3) errs.duration = "Duration must be 1-3 days";

    if (data.startDate && data.rounds.length > 0) {
      const end = getEventEndDate(data.startDate, data.duration);
      const eventStartDt = data.startDate + "T00:00:00";
      const eventEndDt = end + "T23:59:59";
      for (let i = 0; i < data.rounds.length; i++) {
        const r = data.rounds[i];
        if (r.startDate < eventStartDt || r.endDate > eventEndDt) {
          errs.rounds = "All rounds must fall within the event period";
          break;
        }
        if (r.startDate >= r.endDate) {
          errs.rounds = "Each round's end must be after its start";
          break;
        }
        if (i > 0) {
          const prev = data.rounds[i - 1];
          if (r.startDate < prev.endDate) {
            errs.rounds = "Rounds must not overlap with each other";
            break;
          }
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 3: Timeline & Rounds</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Start Date</label>
          <input type="date" value={data.startDate} onChange={(e) => updateData({ startDate: e.target.value })} style={{ ...inputStyle, borderColor: errors.startDate ? "#ef4444" : undefined }} />
          {errors.startDate && <p style={errorStyle}>{errors.startDate}</p>}
        </div>
        <div>
          <label style={labelStyle}>Duration (days)</label>
          <input type="number" value={data.duration} onChange={(e) => updateData({ duration: parseInt(e.target.value) || 1 })} style={{ ...inputStyle, borderColor: errors.duration ? "#ef4444" : undefined }} min={1} max={3} />
          {errors.duration && <p style={errorStyle}>{errors.duration}</p>}
        </div>
      </div>

      {data.startDate && (
        <div style={{
          padding: "10px 14px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd",
          borderRadius: 8, fontSize: 13, color: "#0369a1",
        }}>
          Event period: <strong>{data.startDate}</strong> to <strong>{eventEnd}</strong> ({data.duration} day{data.duration > 1 ? "s" : ""})
          — all rounds must fall within this window.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Registration Opens</label>
          <input type="date" value={data.registrationOpenDate} onChange={(e) => updateData({ registrationOpenDate: e.target.value })} style={{ ...inputStyle, borderColor: errors.registrationOpenDate ? "#ef4444" : undefined }} />
          {errors.registrationOpenDate && <p style={errorStyle}>{errors.registrationOpenDate}</p>}
        </div>
        <div>
          <label style={labelStyle}>Registration Closes</label>
          <input type="date" value={data.registrationDeadline} onChange={(e) => updateData({ registrationDeadline: e.target.value })} style={{ ...inputStyle, borderColor: errors.registrationDeadline ? "#ef4444" : undefined }} />
          {errors.registrationDeadline && <p style={errorStyle}>{errors.registrationDeadline}</p>}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Rounds</label>
        {errors.rounds && <p style={{ ...errorStyle, marginBottom: 8 }}>{errors.rounds}</p>}

        <div className="flex flex-col gap-2" style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8, marginBottom: 8 }}>
          <div className="grid grid-cols-4 gap-2">
            <input value={roundName} onChange={(e) => setRoundName(e.target.value)} style={inputStyle} placeholder="Round name" />
            <input
              type="datetime-local"
              value={roundStart}
              onChange={(e) => setRoundStart(e.target.value)}
              style={inputStyle}
              min={roundMinDt}
              max={roundMaxDt}
              title="Round start (must be within event period)"
            />
            <input
              type="datetime-local"
              value={roundEnd}
              onChange={(e) => setRoundEnd(e.target.value)}
              style={inputStyle}
              min={roundMinDt}
              max={roundMaxDt}
              title="Round end (must be within event period)"
            />
            <div className="flex gap-2">
              <input type="number" value={roundCutoff} onChange={(e) => setRoundCutoff(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 80 }} min={1} placeholder="Top N" title="Teams advancing" />
              <button onClick={addRound} style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                Add
              </button>
            </div>
          </div>
          {addRoundErrors.length > 0 && (
            <div style={warnBoxStyle}>
              {addRoundErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>

        {data.rounds.map((r, idx) => {
          const warnings = getRoundWarnings(
            r,
            data.startDate,
            eventEnd,
            idx > 0 ? data.rounds[idx - 1] : null,
          );
          const hasWarning = warnings.length > 0;

          return (
            <div
              key={idx}
              style={{
                padding: "10px 12px",
                backgroundColor: hasWarning ? "#fef2f2" : "#ffffff",
                border: `1px solid ${hasWarning ? "#fecaca" : "rgba(223,226,236,0.5)"}`,
                borderRadius: 6, marginBottom: 4,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Round {idx + 1}: {r.name}</span>
                  <span style={{ fontSize: 12, color: "#8891a5", marginLeft: 12 }}>
                    Top {r.advancementCutoff} advance
                  </span>
                </div>
                <button onClick={() => removeRound(idx)} style={{ color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
              </div>
              <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
                {formatDateTime(r.startDate)} → {formatDateTime(r.endDate)}
              </p>
              {warnings.map((w, i) => (
                <p key={i} style={{ fontSize: 12, color: "#991b1b", marginTop: 2 }}>
                  ⚠ {w}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Back</button>
        <button onClick={() => { if (validate()) onNext(); }} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
