"use client";

import { useId, useState } from "react";
import type {
  EventResponse,
  HonoredGuestRequest,
  PrizeAssignmentMode,
  PrizeRank,
  PrizeRequest,
} from "@/lib/api";
import { useUpdateEvent } from "@/features/admin/hooks/use-admin-hackathons";
import {
  FREE_TEXT_PRIZE_LABEL,
  isLegacyFreeTextPrize,
  parsePrizeAmount,
  PRIZE_RANK_LABELS,
  resolveAssignmentMode,
  validatePrizeOrdering,
} from "@/lib/prize.utils";
import { RequiredDigitsInput } from "@/shared/ui/required-digits-input";
import {
  bannerErrorStyle,
  inputStyle,
  isEventEditable,
  labelStyle,
  mergeEventUpdate,
} from "@/features/admin/components/event-edit/event-edit.utils";

type ExtraPrizeRow = {
  key: string;
  label: string;
  amount: string;
  assignmentMode: PrizeAssignmentMode;
};

function amountDigitsFromValue(value: string): string {
  const n = parsePrizeAmount(value);
  return n != null ? String(n) : "";
}

function loadFixedAmount(prizes: EventResponse["prizes"], rank: PrizeRank): string {
  const prize = prizes.find((p) => p.rank === rank);
  return prize ? amountDigitsFromValue(prize.value) : "";
}

function loadExtras(prizes: EventResponse["prizes"]): ExtraPrizeRow[] {
  return prizes
    .filter((p) => p.rank === "CONSOLATION" && !isLegacyFreeTextPrize(p))
    .map((p, idx) => ({
      key: p.id ?? `extra-${idx}`,
      label: (p.label ?? "").trim() === FREE_TEXT_PRIZE_LABEL ? "" : (p.label ?? "").trim(),
      amount: amountDigitsFromValue(p.value),
      assignmentMode: resolveAssignmentMode(p.rank, p.assignmentMode),
    }));
}

function buildPrizePayload(
  first: string,
  second: string,
  third: string,
  extras: ExtraPrizeRow[],
): PrizeRequest[] {
  const fixed: { rank: PrizeRank; amount: string; label: string }[] = [
    { rank: "FIRST", amount: first, label: PRIZE_RANK_LABELS.FIRST },
    { rank: "SECOND", amount: second, label: PRIZE_RANK_LABELS.SECOND },
    { rank: "THIRD", amount: third, label: PRIZE_RANK_LABELS.THIRD },
  ];

  const payload: PrizeRequest[] = fixed.map((p) => ({
    rank: p.rank,
    value: p.amount,
    quantity: 1,
    label: p.label,
    assignmentMode: "RANK_BASED" as const,
  }));

  for (const extra of extras) {
    payload.push({
      rank: "CONSOLATION",
      value: extra.amount,
      quantity: 1,
      label: extra.label.trim(),
      assignmentMode: extra.assignmentMode,
    });
  }

  return payload;
}

function validatePrizeForm(
  first: string,
  second: string,
  third: string,
  extras: ExtraPrizeRow[],
): string | null {
  const fields: { name: string; amount: string }[] = [
    { name: "First Prize", amount: first },
    { name: "Second Prize", amount: second },
    { name: "Third Prize", amount: third },
  ];

  for (const field of fields) {
    const amount = parsePrizeAmount(field.amount);
    if (amount == null || amount <= 0) {
      return `${field.name} amount must be a positive number (VND).`;
    }
  }

  for (let i = 0; i < extras.length; i++) {
    const extra = extras[i];
    if (!extra.label.trim()) {
      return `Additional prize #${i + 1} requires a name.`;
    }
    const amount = parsePrizeAmount(extra.amount);
    if (amount == null || amount <= 0) {
      return `Additional prize "${extra.label.trim()}" amount must be a positive number (VND).`;
    }
  }

  return validatePrizeOrdering(buildPrizePayload(first, second, third, extras));
}

function AmountField({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (digits: string) => void;
  disabled: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label style={labelStyle}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <RequiredDigitsInput
            value={value}
            onValueChange={onChange}
            disabled={disabled}
            emptyMessage={required ? "Amount is required" : undefined}
            placeholder="e.g. 7000000"
            style={inputStyle}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", minWidth: 36 }}>VND</span>
      </div>
    </div>
  );
}

export function PrizesHonoredGuestTab({ event }: { event: EventResponse }) {
  const eventId = event.id;
  const editable = isEventEditable(event.status);
  const { mutate: update, isPending } = useUpdateEvent();
  const idPrefix = useId();

  const [firstAmount, setFirstAmount] = useState(() => loadFixedAmount(event.prizes, "FIRST"));
  const [secondAmount, setSecondAmount] = useState(() => loadFixedAmount(event.prizes, "SECOND"));
  const [thirdAmount, setThirdAmount] = useState(() => loadFixedAmount(event.prizes, "THIRD"));
  const [extras, setExtras] = useState<ExtraPrizeRow[]>(() => loadExtras(event.prizes));

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

    const validationError = validatePrizeForm(firstAmount, secondAmount, thirdAmount, extras);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    update(
      {
        eventId,
        ...mergeEventUpdate(event, {
          prizes: buildPrizePayload(firstAmount, secondAmount, thirdAmount, extras),
          honoredGuests: guests,
        }),
      },
      {
        onSuccess: () => setSaveSuccess(true),
        onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save prizes"),
      },
    );
  };

  const addExtra = () => {
    setExtras((prev) => [
      ...prev,
      {
        key: `${idPrefix}-extra-${Date.now()}-${prev.length}`,
        label: "",
        amount: "",
        assignmentMode: "RANK_BASED",
      },
    ]);
  };

  const updateExtra = (
    key: string,
    patch: Partial<Pick<ExtraPrizeRow, "label" | "amount" | "assignmentMode">>,
  ) => {
    setExtras((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeExtra = (key: string) => {
    setExtras((prev) => prev.filter((row) => row.key !== key));
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
        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Prizes</label>
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2, marginBottom: 0 }}>
              Enter First, Second, and Third Prize amounts in VND. Additional prizes are optional.
            </p>
          </div>

          <AmountField
            label="First Prize"
            value={firstAmount}
            onChange={setFirstAmount}
            disabled={!editable}
            required
          />
          <AmountField
            label="Second Prize"
            value={secondAmount}
            onChange={setSecondAmount}
            disabled={!editable}
            required
          />
          <AmountField
            label="Third Prize"
            value={thirdAmount}
            onChange={setThirdAmount}
            disabled={!editable}
            required
          />

          <div className="flex flex-col gap-3" style={{ marginTop: 4 }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Additional prizes (optional)</label>
                <p style={{ fontSize: 12, color: "#8891a5", margin: 0 }}>
                  Encouragement = auto by ranking. Other = pick team manually when assigning awards.
                </p>
              </div>
              <button
                type="button"
                onClick={addExtra}
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

            {extras.length === 0 && (
              <p style={{ fontSize: 12, color: "#8891a5", margin: 0 }}>No additional prizes yet.</p>
            )}

            {extras.map((row, idx) => (
              <div
                key={row.key}
                className="flex flex-col gap-2"
                style={{
                  padding: 12,
                  backgroundColor: "#f8f9fc",
                  borderRadius: 8,
                  border: "1px solid rgba(223,226,236,0.9)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>
                    Additional prize #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtra(row.key)}
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
                <div className="flex flex-col gap-1">
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>Type</label>
                  <select
                    value={row.assignmentMode}
                    onChange={(e) =>
                      updateExtra(row.key, {
                        assignmentMode: e.target.value as PrizeAssignmentMode,
                      })
                    }
                    disabled={!editable}
                    style={inputStyle}
                  >
                    <option value="RANK_BASED">Encouragement (by ranking)</option>
                    <option value="MANUAL">Other (manual team)</option>
                  </select>
                </div>
                <input
                  value={row.label}
                  onChange={(e) => updateExtra(row.key, { label: e.target.value })}
                  disabled={!editable}
                  style={inputStyle}
                  placeholder={
                    row.assignmentMode === "MANUAL"
                      ? "e.g. Most Liked on Social Media"
                      : "e.g. Encouragement Prize"
                  }
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <RequiredDigitsInput
                      value={row.amount}
                      onValueChange={(digits) => updateExtra(row.key, { amount: digits })}
                      disabled={!editable}
                      emptyMessage="Amount is required"
                      placeholder="e.g. 1500000"
                      style={inputStyle}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#8891a5", minWidth: 36 }}>
                    VND
                  </span>
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
