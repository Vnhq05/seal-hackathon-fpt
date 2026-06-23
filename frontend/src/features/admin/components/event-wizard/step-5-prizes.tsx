"use client";

import { useState } from "react";
import { useEventWizardStore, type WizardPrize, type WizardGuest } from "@/features/admin/store/event-wizard.store";
import type { PrizeRank } from "@/lib/api/event.api";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };

const PRIZE_RANKS: { value: PrizeRank; label: string }[] = [
  { value: "FIRST", label: "1st Place" },
  { value: "SECOND", label: "2nd Place" },
  { value: "THIRD", label: "3rd Place" },
  { value: "CONSOLATION", label: "Consolation" },
];

export function Step5Prizes({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const [prizeRank, setPrizeRank] = useState<PrizeRank>("FIRST");
  const [prizeValue, setPrizeValue] = useState("");
  const [prizeQty, setPrizeQty] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");

  const addPrize = () => {
    if (!prizeValue.trim()) return;
    const prize: WizardPrize = { rank: prizeRank, value: prizeValue.trim(), quantity: prizeQty };
    updateData({ prizes: [...data.prizes, prize] });
    setPrizeValue("");
    setPrizeQty(1);
  };

  const removePrize = (idx: number) => {
    updateData({ prizes: data.prizes.filter((_, i) => i !== idx) });
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

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 5: Prizes & Guests</h2>

      <div>
        <label style={labelStyle}>Prizes (per track)</label>
        <div className="flex gap-2" style={{ marginBottom: 8 }}>
          <select value={prizeRank} onChange={(e) => setPrizeRank(e.target.value as PrizeRank)} style={{ ...inputStyle, width: 140 }}>
            {PRIZE_RANKS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Prize value (e.g. 500 USD)" />
          <input type="number" value={prizeQty} onChange={(e) => setPrizeQty(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 80 }} min={1} placeholder="Qty" />
          <button onClick={addPrize} style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Add</button>
        </div>
        {data.prizes.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between" style={{ padding: "8px 12px", backgroundColor: "#f8f9fc", borderRadius: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{PRIZE_RANKS.find(r => r.value === p.rank)?.label}: {p.value} (x{p.quantity})</span>
            <button onClick={() => removePrize(idx)} style={{ color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      <div>
        <label style={labelStyle}>Tiebreaker Criteria</label>
        <input
          value={data.tiebreakerCriteria}
          onChange={(e) => updateData({ tiebreakerCriteria: e.target.value })}
          style={inputStyle}
          placeholder="e.g. Earlier submission time, then technical score"
        />
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
        <button onClick={onNext} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>Next</button>
      </div>
    </div>
  );
}
