"use client";

import { useEffect, useState } from "react";
import { formatEventDateTime } from "@/features/events/utils/event-landing.utils";
import {
  getGateDeadlineFromRound,
  groupSchedulesByDay,
  resolveScheduleStatus,
  scheduleGateLabel,
  scheduleStatusLabel,
  scheduleTypeLabel,
  sortSchedules,
} from "@/features/events/utils/schedule.utils";
import type { EventScheduleResponse, ScheduleType } from "@/lib/api/schedule.api";
import type { RoundResponse } from "@/lib/api/round.api";

const STATUS_STYLES = {
  upcoming: "border-seal-border bg-seal-surface-elevated text-seal-text-secondary",
  active: "border-seal-cyan bg-seal-cyan/10 text-seal-cyan",
  completed: "border-seal-border bg-seal-surface text-seal-text-muted",
} as const;

const ITEM_STYLES = {
  upcoming: "border-navy/40 bg-white opacity-80",
  active: "border-seal-cyan bg-white shadow-[4px_4px_0_0_#0c1228]",
  completed: "border-navy/20 bg-seal-surface-elevated opacity-70",
} as const;

export interface EventScheduleTimelineProps {
  schedules: EventScheduleResponse[];
  rounds?: RoundResponse[];
  variant?: "compact" | "full";
  highlightTypes?: ScheduleType[];
  showDayHeaders?: boolean;
  preliminaryRound?: RoundResponse | null;
}

function ScheduleItemCard({
  item,
  variant,
  highlighted,
  preliminaryRound,
  now,
}: {
  item: EventScheduleResponse;
  variant: "compact" | "full";
  highlighted: boolean;
  preliminaryRound?: RoundResponse | null;
  now: number;
}) {
  const status = resolveScheduleStatus(item, now);
  const gateDeadline = getGateDeadlineFromRound(item.gate, preliminaryRound ?? undefined);

  return (
    <div
      className={`rounded-none border-2 p-4 transition-all ${ITEM_STYLES[status]} ${
        highlighted ? "ring-2 ring-seal-cyan/30" : ""
      } ${variant === "compact" ? "p-3" : "p-5"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-seal-cyan">
          {scheduleTypeLabel(item.type)}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${STATUS_STYLES[status]}`}
        >
          {scheduleStatusLabel(status)}
        </span>
        {item.gate && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            {scheduleGateLabel(item.gate)}
          </span>
        )}
      </div>

      <h3 className={`mt-2 font-mono font-bold text-seal-text ${variant === "compact" ? "text-sm" : "text-lg"}`}>
        {item.title}
      </h3>

      {item.description && variant === "full" && (
        <p className="mt-2 text-sm text-seal-text-secondary">{item.description}</p>
      )}

      <p className={`mt-2 font-mono text-seal-text ${variant === "compact" ? "text-xs" : "text-sm"}`}>
        {formatEventDateTime(item.startTime)} → {formatEventDateTime(item.endTime)}
      </p>

      {gateDeadline && (
        <p className="mt-1 font-mono text-xs text-seal-cyan">
          System deadline: {formatEventDateTime(gateDeadline)}
        </p>
      )}
    </div>
  );
}

export function EventScheduleTimeline({
  schedules,
  rounds,
  variant = "full",
  highlightTypes,
  showDayHeaders = true,
  preliminaryRound,
}: EventScheduleTimelineProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (schedules.length === 0) return null;

  const sorted = sortSchedules(schedules);
  const prelim =
    preliminaryRound ??
    rounds?.find((r) => r.roundType === "PRELIMINARY") ??
    rounds?.[0] ??
    null;

  const isHighlighted = (type: ScheduleType) =>
    !highlightTypes || highlightTypes.length === 0 || highlightTypes.includes(type);

  if (variant === "compact") {
    const milestones = sorted.filter((s) => s.type === "MILESTONE");
    const displayItems =
      milestones.length > 0
        ? milestones
        : sorted.filter((s) => isHighlighted(s.type)).slice(0, 4);

    return (
      <div className="flex flex-col gap-3">
        {displayItems.map((item) => (
          <ScheduleItemCard
            key={item.id}
            item={item}
            variant="compact"
            highlighted={isHighlighted(item.type)}
            preliminaryRound={prelim}
            now={now}
          />
        ))}
      </div>
    );
  }

  const dayGroups = showDayHeaders ? groupSchedulesByDay(sorted) : [{ dateKey: "", dateLabel: "", items: sorted }];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div
        className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-seal-cyan/50 via-seal-mint/30 to-transparent"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-10">
        {dayGroups.map((group) => (
          <div key={group.dateKey || "all"}>
            {showDayHeaders && group.dateLabel && (
              <h3 className="mb-4 pl-16 font-mono text-sm font-bold uppercase tracking-wider text-seal-text-secondary">
                {group.dateLabel}
              </h3>
            )}
            <div className="flex flex-col gap-6">
              {group.items.map((item, index) => (
                <div key={item.id} className="relative pl-16">
                  <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-seal-cyan bg-seal-bg font-mono text-xs font-bold text-seal-cyan">
                    {index + 1}
                  </div>
                  <ScheduleItemCard
                    item={item}
                    variant="full"
                    highlighted={isHighlighted(item.type)}
                    preliminaryRound={prelim}
                    now={now}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
