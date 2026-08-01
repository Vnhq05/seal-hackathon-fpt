"use client";

import { useState } from "react";
import type {
  EventResponse,
  HonoredGuestRequest,
  PrizeAssignmentMode,
  PrizeRank,
  PrizeRequest,
} from "@/lib/api";
import { useUpdateEvent } from "@/features/admin/hooks/use-admin-hackathons";
import {
  DEFAULT_CONSOLATION_LABEL,
  parsePrizeAmount,
  resolveAssignmentMode,
  validateStructuredPrizes,
} from "@/lib/prize.utils";
import {
  bannerErrorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
  mergeEventUpdate,
} from "@/features/admin/components/event-edit/event-edit.utils";

type AdditionalKind = "ENCOURAGEMENT" | "OTHER";

type AdditionalPrizeDraft = {
  kind: AdditionalKind;
  label: string;
  value: string;
};

function extractPodium(prizes: EventResponse["prizes"]) {
  const first = prizes.find((p) => p.rank === "FIRST");
  const second = prizes.find((p) => p.rank === "SECOND");
  const third = prizes.find((p) => p.rank === "THIRD");
  return {
    first: first?.value?.replace(/[^\d]/g, "") ?? "",
    second: second?.value?.replace(/[^\d]/g, "") ?? "",
    third: third?.value?.replace(/[^\d]/g, "") ?? "",
  };
}

function extractAdditional(prizes: EventResponse["prizes"]): AdditionalPrizeDraft[] {
  return prizes
    .filter((p) => p.rank === "CONSOLATION" || p.rank === "OTHER")
    .map((p) => ({
      kind: (p.rank === "OTHER" ? "OTHER" : "ENCOURAGEMENT") as AdditionalKind,
      label: p.label?.trim() || (p.rank === "OTHER" ? "" : DEFAULT_CONSOLATION_LABEL),
      value: p.value?.replace(/[^\d]/g, "") ?? "",
    }));
}

function amountField(
  value: string,
  onChange: (v: string) => void,
  disabled: boolean,
  placeholder: string,
) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        disabled={disabled}
        style={{ ...inputStyle, paddingRight: 52 }}
        placeholder={placeholder}
        inputMode="numeric"
      />
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 12,
          fontWeight: 600,
          color: "#8891a5",
        }}
      >
        VND
      </span>
    </div>
  );
}

export function PrizesHonoredGuestTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);
  const { mutate: update, isPending } = useUpdateEvent();

  const initialPodium = extractPodium(event.prizes);
  const [firstPrize, setFirstPrize] = useState(initialPodium.first);
  const [secondPrize, setSecondPrize] = useState(initialPodium.second);
  const [thirdPrize, setThirdPrize] = useState(initialPodium.third);
  const [additional, setAdditional] = useState<AdditionalPrizeDraft[]>(() =>
    extractAdditional(event.prizes),
  );

  const [guests, setGuests] = useState<HonoredGuestRequest[]>(
    event.honoredGuests.map((g) => ({ fullName: g.fullName, title: g.title ?? undefined })),
  );
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const buildPrizeRequests = (): PrizeRequest[] | null => {
    const prizes: PrizeRequest[] = [
      {
        rank: "FIRST",
        value: firstPrize,
        quantity: 1,
        label: "First Prize",
        assignmentMode: "RANK_BASED",
      },
      {
        rank: "SECOND",
        value: secondPrize,
        quantity: 1,
        label: "Second Prize",
        assignmentMode: "RANK_BASED",
      },
      {
        rank: "THIRD",
        value: thirdPrize,
        quantity: 1,
        label: "Third Prize",
        assignmentMode: "RANK_BASED",
      },
    ];

    for (const item of additional) {
      const rank: PrizeRank = item.kind === "OTHER" ? "OTHER" : "CONSOLATION";
      const assignmentMode: PrizeAssignmentMode = resolveAssignmentMode(rank);
      prizes.push({
        rank,
        value: item.value,
        quantity: 1,
        label:
          item.label.trim() ||
          (item.kind === "OTHER" ? "" : DEFAULT_CONSOLATION_LABEL),
        assignmentMode,
      });
    }

    const error = validateStructuredPrizes(prizes);
    if (error) {
      setSaveError(error);
      return null;
    }
    return prizes;
  };

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);
    const prizes = buildPrizeRequests();
    if (!prizes) return;

    update(
      {
        eventId,
        ...mergeEventUpdate(event, {
          prizes,
          honoredGuests: guests,
        }),
      },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save prizes"),
      },
    );
  };

  const addAdditional = () => {
    setAdditional((prev) => [
      ...prev,
      { kind: "ENCOURAGEMENT", label: DEFAULT_CONSOLATION_LABEL, value: "" },
    ]);
  };

  const updateAdditional = (idx: number, patch: Partial<AdditionalPrizeDraft>) => {
    setAdditional((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, ...patch };
        if (patch.kind === "ENCOURAGEMENT" && !patch.label) {
          next.label = next.label || DEFAULT_CONSOLATION_LABEL;
        }
        return next;
      }),
    );
  };

  const removeAdditional = (idx: number) => {
    setAdditional((prev) => prev.filter((_, i) => i !== idx));
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

  const podiumHint =
    parsePrizeAmount(firstPrize) != null &&
    parsePrizeAmount(secondPrize) != null &&
    parsePrizeAmount(thirdPrize) != null
      ? null
      : "Enter First, Second, and Third Prize amounts in VND.";

  return (
    <div className="flex flex-col gap-5 max-w-[700px]">
      {!editable && (
        <div style={bannerErrorStyle}>
          Prizes cannot be modified while the event is active or completed.
        </div>
      )}

      <div className="flex flex-col gap-5 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div>
          <label style={labelStyle}>Prizes</label>
          <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4, marginBottom: 16 }}>
            Enter First, Second, and Third Prize amounts in VND. Additional prizes are optional.
          </p>

          <div className="flex flex-col gap-3">
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>First Prize</label>
              {amountField(firstPrize, setFirstPrize, !editable, "e.g. 7000000")}
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Second Prize</label>
              {amountField(secondPrize, setSecondPrize, !editable, "e.g. 5000000")}
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: 12 }}>Third Prize</label>
              {amountField(thirdPrize, setThirdPrize, !editable, "e.g. 3000000")}
            </div>
          </div>
          {podiumHint && (
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 8 }}>{podiumHint}</p>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Additional prizes (optional)</label>
              <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
                Encouragement = auto by ranking. Other = pick team manually when assigning awards.
              </p>
            </div>
            <button
              type="button"
              onClick={addAdditional}
              disabled={!editable}
              style={{
                backgroundColor: "#38bdf8",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                cursor: editable ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Add prize
            </button>
          </div>

          {additional.length === 0 && (
            <p style={{ fontSize: 13, color: "#8891a5" }}>No additional prizes yet.</p>
          )}

          <div className="flex flex-col gap-3">
            {additional.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid rgba(198,198,205,0.6)",
                  borderRadius: 8,
                  padding: 12,
                  backgroundColor: "#f8f9fc",
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Additional prize #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeAdditional(idx)}
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
                <div className="flex flex-col gap-2">
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Type</label>
                    <select
                      value={item.kind}
                      disabled={!editable}
                      onChange={(e) =>
                        updateAdditional(idx, {
                          kind: e.target.value as AdditionalKind,
                          label:
                            e.target.value === "ENCOURAGEMENT"
                              ? item.label || DEFAULT_CONSOLATION_LABEL
                              : item.label,
                        })
                      }
                      style={inputStyle}
                    >
                      <option value="ENCOURAGEMENT">Encouragement (by ranking)</option>
                      <option value="OTHER">Other (manual team)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Name</label>
                    <input
                      value={item.label}
                      disabled={!editable}
                      onChange={(e) => updateAdditional(idx, { label: e.target.value })}
                      style={inputStyle}
                      placeholder={
                        item.kind === "OTHER"
                          ? "e.g. Most Liked on Social Media"
                          : DEFAULT_CONSOLATION_LABEL
                      }
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Amount</label>
                    {amountField(
                      item.value,
                      (v) => updateAdditional(idx, { value: v }),
                      !editable,
                      "e.g. 1500000",
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
