"use client";

import { useState } from "react";
import type { EventResponse, HonoredGuestRequest, PrizeRequest } from "@/lib/api";
import { useUpdateEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { getPrizeLabel } from "@/lib/prize.utils";
import {
  bannerErrorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
  mergeEventUpdate,
} from "@/features/admin/components/event-edit/event-edit.utils";

const FREE_TEXT_PRIZE_LABEL = "Prizes";

function isFreeTextPrize(p: Pick<PrizeRequest, "rank" | "label">): boolean {
  return p.rank === "CONSOLATION" && (!p.label || p.label === FREE_TEXT_PRIZE_LABEL);
}

function prizesToText(prizes: PrizeRequest[]): string {
  if (prizes.length === 0) return "";
  if (prizes.length === 1 && isFreeTextPrize(prizes[0])) {
    return prizes[0].value;
  }
  return prizes
    .map((p) => {
      const label = getPrizeLabel(p.rank, p.label);
      const qty = p.quantity > 1 ? ` × ${p.quantity}` : "";
      return `${label}: ${p.value}${qty}`;
    })
    .join("\n");
}

function textToPrizes(text: string): PrizeRequest[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return [
    {
      rank: "CONSOLATION",
      value: trimmed,
      quantity: 1,
      label: FREE_TEXT_PRIZE_LABEL,
    },
  ];
}

export function PrizesHonoredGuestTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);
  const { mutate: update, isPending } = useUpdateEvent();

  const existingPrizes: PrizeRequest[] = event.prizes.map((p) => ({
    trackId: p.trackId ?? undefined,
    rank: p.rank,
    value: p.value,
    quantity: p.quantity,
    label: p.label ?? undefined,
  }));

  const [prizeText, setPrizeText] = useState(() => prizesToText(existingPrizes));
  const [guests, setGuests] = useState<HonoredGuestRequest[]>(
    event.honoredGuests.map((g) => ({ fullName: g.fullName, title: g.title ?? undefined })),
  );
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    update(
      {
        eventId,
        ...mergeEventUpdate(event, {
          prizes: textToPrizes(prizeText),
          honoredGuests: guests,
        }),
      },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save prizes"),
      },
    );
  };

  const addGuest = () => {
    if (!guestName.trim()) return;
    setGuests([...guests, { fullName: guestName.trim(), title: guestTitle.trim() || undefined }]);
    setGuestName("");
    setGuestTitle("");
  };

  const removeGuest = (idx: number) => {
    setGuests(guests.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-5 max-w-[700px]">
      {!editable && (
        <div style={bannerErrorStyle}>
          Prizes cannot be modified while the event is active or completed.
        </div>
      )}

      <div className="flex flex-col gap-5 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={labelStyle}>Prizes</label>
          <textarea
            value={prizeText}
            onChange={(e) => setPrizeText(e.target.value)}
            disabled={!editable}
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder={"Enter prize details (e.g. First Prize: 5,000,000 VND\nSecond Prize: 3,000,000 VND)"}
          />
        </div>

        <div>
          <label style={labelStyle}>Honored Guests</label>
          <div className="flex gap-2" style={{ marginBottom: 8 }}>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              disabled={!editable}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Full name"
            />
            <input
              value={guestTitle}
              onChange={(e) => setGuestTitle(e.target.value)}
              disabled={!editable}
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Title (optional)"
            />
            <button
              type="button"
              onClick={addGuest}
              disabled={!editable}
              style={{
                backgroundColor: "#38bdf8",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: editable ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Add
            </button>
          </div>
          {guests.map((g, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between"
              style={{
                padding: "8px 12px",
                backgroundColor: "#f8f9fc",
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 14 }}>
                {g.fullName}
                {g.title ? ` — ${g.title}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeGuest(idx)}
                disabled={!editable}
                style={{
                  color: "#991b1b",
                  background: "none",
                  border: "none",
                  cursor: editable ? "pointer" : "not-allowed",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {saveError && <div style={bannerErrorStyle}>{saveError}</div>}
        {saveSuccess && (
          <div
            style={{
              ...bannerErrorStyle,
              color: "#166534",
              backgroundColor: "#dcfce7",
              borderColor: "#bbf7d0",
            }}
          >
            Saved successfully.
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!editable || isPending}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
