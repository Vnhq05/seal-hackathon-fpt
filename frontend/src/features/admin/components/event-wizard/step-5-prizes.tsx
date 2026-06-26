"use client";

import { useEffect, useState } from "react";
import { useEventWizardStore, type WizardGuest, type WizardPrize } from "@/features/admin/store/event-wizard.store";
import {
  DEFAULT_CONSOLATION_LABEL,
  getPrizeLabel,
  PRIZE_RANK_LABELS,
  validatePrizeOrdering,
} from "@/features/admin/utils/event-wizard.utils";
import type { PrizeRank } from "@/lib/api/event.api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

interface PrizeRow {
  id: string;
  rank: PrizeRank;
  value: string;
  quantity: number;
  label?: string;
}

function defaultRows(): PrizeRow[] {
  return [
    { id: "first", rank: "FIRST", value: "", quantity: 1 },
    { id: "second", rank: "SECOND", value: "", quantity: 1 },
    { id: "third", rank: "THIRD", value: "", quantity: 1 },
  ];
}

function rowsFromPrizes(prizes: WizardPrize[], trackIndex?: number): PrizeRow[] {
  const filtered = prizes.filter((p) =>
    trackIndex == null ? p.trackIndex == null : p.trackIndex === trackIndex
  );
  if (filtered.length === 0) return defaultRows();
  return filtered.map((p, i) => ({
    id: `${p.rank}-${i}`,
    rank: p.rank,
    value: p.value,
    quantity: p.quantity,
    label: p.label,
  }));
}

function rowsToPrizes(rows: PrizeRow[], trackIndex?: number): WizardPrize[] {
  return rows
    .filter((r) => r.value.trim())
    .map((r) => ({
      rank: r.rank,
      value: r.value.trim(),
      quantity: Math.max(1, r.quantity),
      ...(r.rank === "CONSOLATION" && r.label?.trim()
        ? { label: r.label.trim() }
        : r.rank === "CONSOLATION"
          ? { label: DEFAULT_CONSOLATION_LABEL }
          : {}),
      ...(trackIndex != null ? { trackIndex } : {}),
    }));
}

function PrizeForm({
  title,
  rows,
  onChange,
  onSave,
  saveError,
}: {
  title: string;
  rows: PrizeRow[];
  onChange: (rows: PrizeRow[]) => void;
  onSave: () => void;
  saveError?: string;
}) {
  const updateRow = (id: string, patch: Partial<PrizeRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const addConsolation = () => {
    onChange([
      ...rows,
      {
        id: `consolation-${Date.now()}`,
        rank: "CONSOLATION",
        value: "",
        quantity: 1,
        label: DEFAULT_CONSOLATION_LABEL,
      },
    ]);
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#f8f9fc", borderRadius: 8 }}>
      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</p>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-1" style={{ padding: 10, backgroundColor: "#fff", borderRadius: 8, border: "1px solid rgba(223,226,236,0.5)" }}>
            <div className="flex items-center justify-between">
              {row.rank === "CONSOLATION" ? (
                <input
                  value={row.label ?? DEFAULT_CONSOLATION_LABEL}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  style={{ ...inputStyle, flex: 1, marginRight: 8, fontWeight: 600 }}
                  placeholder="Tên giải khuyến khích"
                />
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600 }}>{PRIZE_RANK_LABELS[row.rank]}</span>
              )}
              {row.rank === "CONSOLATION" && (
                <button type="button" onClick={() => removeRow(row.id)} style={{ color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Remove
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g. 5,000,000 VND"
              />
              <input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) => updateRow(row.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                style={{ ...inputStyle, width: 80 }}
                title="Quantity"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2" style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={addConsolation}
          style={{ backgroundColor: "#ffffff", color: "#0e1528", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          + Add consolation prize
        </button>
        <button
          type="button"
          onClick={onSave}
          style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          Save prizes
        </button>
      </div>
      {saveError && <p style={errorStyle}>{saveError}</p>}
    </div>
  );
}

export function Step5Prizes({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();

  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  const [sharedRows, setSharedRows] = useState<PrizeRow[]>(() => rowsFromPrizes(data.prizes));
  const [trackRows, setTrackRows] = useState<Record<number, PrizeRow[]>>(() => {
    const map: Record<number, PrizeRow[]> = {};
    data.tracks.forEach((_, idx) => {
      map[idx] = rowsFromPrizes(data.prizes, idx);
    });
    return map;
  });

  useEffect(() => {
    if (data.applyPrizesToAllTracks) {
      setSharedRows(rowsFromPrizes(data.prizes));
    } else {
      const map: Record<number, PrizeRow[]> = {};
      data.tracks.forEach((_, idx) => {
        map[idx] = rowsFromPrizes(data.prizes, idx);
      });
      setTrackRows(map);
    }
  }, [data.applyPrizesToAllTracks, data.prizes, data.tracks.length]);

  const handleModeChange = (applyAll: boolean) => {
    setFormError(null);
    setSaveErrors({});
    if (applyAll) {
      setSharedRows(rowsFromPrizes(data.prizes));
      updateData({ applyPrizesToAllTracks: true, prizes: data.prizes.filter((p) => p.trackIndex == null) });
    } else {
      const map: Record<number, PrizeRow[]> = {};
      data.tracks.forEach((_, idx) => {
        map[idx] = rowsFromPrizes(data.prizes, idx);
      });
      setTrackRows(map);
      updateData({ applyPrizesToAllTracks: false, prizes: data.prizes.filter((p) => p.trackIndex != null) });
    }
  };

  const saveSharedPrizes = () => {
    const prizes = rowsToPrizes(sharedRows);
    const validationError = validatePrizeOrdering(prizes);
    if (validationError) {
      setSaveErrors({ shared: validationError });
      return;
    }
    setSaveErrors({});
    updateData({ prizes });
  };

  const saveTrackPrizes = (trackIndex: number) => {
    const rows = trackRows[trackIndex] ?? defaultRows();
    const prizes = rowsToPrizes(rows, trackIndex);
    const validationError = validatePrizeOrdering(prizes);
    if (validationError) {
      setSaveErrors((prev) => ({ ...prev, [`track-${trackIndex}`]: validationError }));
      return;
    }
    setSaveErrors((prev) => {
      const next = { ...prev };
      delete next[`track-${trackIndex}`];
      return next;
    });
    const otherPrizes = data.prizes.filter((p) => p.trackIndex !== trackIndex);
    updateData({ prizes: [...otherPrizes, ...prizes] });
  };

  const addGuest = () => {
    if (!guestName.trim()) return;
    const guest: WizardGuest = { fullName: guestName.trim(), title: guestTitle.trim() };
    updateData({ honoredGuests: [...data.honoredGuests, guest] });
    setGuestName("");
    setGuestTitle("");
  };

  const removeGuest = (idx: number) => {
    updateData({ honoredGuests: data.honoredGuests.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!data.tiebreakerCriteria.trim()) {
      errs.tiebreaker = "At least one tiebreaker criterion is required";
    }

    const pendingPrizes = data.applyPrizesToAllTracks
      ? rowsToPrizes(sharedRows)
      : data.tracks.flatMap((_, idx) => rowsToPrizes(trackRows[idx] ?? defaultRows(), idx));

    if (!data.applyPrizesToAllTracks) {
      for (let idx = 0; idx < data.tracks.length; idx++) {
        const trackPrizes = rowsToPrizes(trackRows[idx] ?? defaultRows(), idx);
        if (trackPrizes.length === 0) {
          setFormError(`Track "${data.tracks[idx].name}" chưa có giải thưởng.`);
          setErrors(errs);
          return false;
        }
      }
    }

    const validationError = validatePrizeOrdering(pendingPrizes);
    if (validationError) {
      setFormError(validationError);
    } else {
      setFormError(null);
      updateData({ prizes: pendingPrizes });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0 && !validationError;
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 5: Prizes & Guests</h2>

      {formError && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
          {formError}
        </div>
      )}

      <div>
        <label style={labelStyle}>Prize Mode</label>
        <div className="flex gap-3" style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            style={{
              flex: 1, padding: "14px 16px", borderRadius: 10,
              border: data.applyPrizesToAllTracks ? "2px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: data.applyPrizesToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>Equal Across Tracks</p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>Same prizes apply to all tracks</p>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            style={{
              flex: 1, padding: "14px 16px", borderRadius: 10,
              border: !data.applyPrizesToAllTracks ? "2px solid #38bdf8" : "1px solid rgba(223,226,236,0.8)",
              backgroundColor: !data.applyPrizesToAllTracks ? "#f0f9ff" : "#ffffff",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 2 }}>Custom Per Track</p>
            <p style={{ fontSize: 12, color: "#8891a5" }}>Configure prizes separately for each track</p>
          </button>
        </div>
      </div>

      {data.applyPrizesToAllTracks ? (
        <PrizeForm
          title="Prizes (all tracks)"
          rows={sharedRows}
          onChange={setSharedRows}
          onSave={saveSharedPrizes}
          saveError={saveErrors.shared}
        />
      ) : data.tracks.length === 0 ? (
        <div style={{ padding: 16, backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
          No tracks configured. Go back to Step 2 to add tracks first.
        </div>
      ) : (
        data.tracks.map((track, idx) => (
          <PrizeForm
            key={idx}
            title={`Prizes — ${track.name}`}
            rows={trackRows[idx] ?? defaultRows()}
            onChange={(rows) => setTrackRows((prev) => ({ ...prev, [idx]: rows }))}
            onSave={() => saveTrackPrizes(idx)}
            saveError={saveErrors[`track-${idx}`]}
          />
        ))
      )}

      {data.prizes.length > 0 && (
        <div>
          <label style={labelStyle}>Saved Prizes</label>
          {data.prizes.map((p, idx) => (
            <p key={idx} style={{ fontSize: 13, color: "#4a5468", marginBottom: 4 }}>
              {p.trackIndex != null ? `[${data.tracks[p.trackIndex]?.name ?? `Track ${p.trackIndex + 1}`}] ` : "[All tracks] "}
              {getPrizeLabel(p.rank, p.label)}: {p.value} × {p.quantity}
            </p>
          ))}
        </div>
      )}

      <div>
        <label style={labelStyle}>Tiebreaker Criteria *</label>
        <input
          value={data.tiebreakerCriteria}
          onChange={(e) => updateData({ tiebreakerCriteria: e.target.value })}
          style={{ ...inputStyle, borderColor: errors.tiebreaker ? "#ef4444" : undefined }}
          placeholder="e.g. Earlier submission time, then technical score"
        />
        {errors.tiebreaker && <p style={errorStyle}>{errors.tiebreaker}</p>}
      </div>

      <div>
        <label style={labelStyle}>Honored Guests</label>
        <div className="flex gap-2" style={{ marginBottom: 8 }}>
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Full name" />
          <input value={guestTitle} onChange={(e) => setGuestTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Title (optional)" />
          <button onClick={addGuest} style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Add</button>
        </div>
        {data.honoredGuests.map((g, idx) => (
          <div key={idx} className="flex items-center justify-between" style={{ padding: "8px 12px", backgroundColor: "#f8f9fc", borderRadius: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{g.fullName}{g.title ? ` — ${g.title}` : ""}</span>
            <button onClick={() => removeGuest(idx)} style={{ color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Back</button>
        <button onClick={() => { if (validate()) onNext(); }} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
