"use client";

import { useState } from "react";
import { useAdminEvents } from "@/features/admin/hooks/use-admin-hackathons";
import { useAdminRounds } from "@/features/admin/hooks/use-admin-rounds";
import { useRoundCriteria, useReplaceAllCriteria } from "@/features/admin/hooks/use-admin-criteria";
import type { CriteriaResponse } from "@/lib/api";
import { DEFAULT_MAX_SCORE, DEFAULT_MIN_SCORE } from "@/features/judging/constants/scoring-scale";

interface CriteriaOverride {
  name: string;
  weight: number;
  description: string;
  minScore: number;
  maxScore: number;
}

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};

export function EventCriteriaPage() {
  const [eventId, setEventId] = useState("");
  const [roundId, setRoundId] = useState("");
  const [overrides, setOverrides] = useState<CriteriaOverride[]>([]);

  const { data: eventsPage } = useAdminEvents();
  const { data: rounds } = useAdminRounds(eventId);
  const { data: existingCriteria } = useRoundCriteria(roundId);
  const { mutate: replaceAll, isPending } = useReplaceAllCriteria(roundId);

  // When criteria load, populate overrides
  const syncOverrides = () => {
    if (existingCriteria && existingCriteria.length > 0 && overrides.length === 0) {
      setOverrides(
        existingCriteria.map((c: CriteriaResponse) => ({
          name: c.name,
          weight: c.weight,
          description: c.description ?? "",
          minScore: c.minScore ?? DEFAULT_MIN_SCORE,
          maxScore: c.maxScore ?? DEFAULT_MAX_SCORE,
        })),
      );
    }
  };
  syncOverrides();

  const events = eventsPage?.content ?? [];
  const roundsList = rounds ?? [];

  const updateWeight = (idx: number, weight: number) => {
    setOverrides(overrides.map((o, i) => (i === idx ? { ...o, weight } : o)));
  };

  const handleSave = () => {
    if (!roundId || overrides.length === 0) return;
    replaceAll(overrides.map((o, idx) => ({
      name: o.name,
      weight: o.weight,
      description: o.description || undefined,
      sortOrder: idx,
      minScore: o.minScore,
      maxScore: o.maxScore,
    })));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Event Criteria Configuration
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Configure criteria for event rounds.
        </p>
      </div>

      <div className="flex flex-col gap-6 p-8 max-w-[720px] border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label style={labelStyle}>Event</label>
            <select value={eventId} onChange={(e) => { setEventId(e.target.value); setRoundId(""); setOverrides([]); }} style={inputStyle}>
              <option value="">Select</option>
              {events.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label style={labelStyle}>Round</label>
            <select value={roundId} onChange={(e) => { setRoundId(e.target.value); setOverrides([]); }} style={inputStyle} disabled={!eventId}>
              <option value="">Select</option>
              {roundsList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>

        {overrides.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 12 }}>Weight Overrides</p>
            <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]" style={{ border: "1px solid rgba(198,198,205,0.5)" }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eef0f6" }}>
                    <th style={headerCell}>Criterion</th>
                    <th style={{ ...headerCell, width: 120 }}>Weight</th>
                    <th style={{ ...headerCell, width: 100 }}>Scale</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((o, idx) => (
                    <tr key={o.name} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                      <td style={bodyCell}>{o.name}</td>
                      <td style={bodyCell}>
                        <input
                          type="number"
                          value={o.weight}
                          onChange={(e) => updateWeight(idx, Number(e.target.value))}
                          style={{ ...inputStyle, width: 80 }}
                          min={0}
                        />
                      </td>
                      <td style={{ ...bodyCell, color: "#8891a5" }}>
                        {o.minScore}–{o.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isPending || !roundId || overrides.length === 0}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
        >
          {isPending ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
