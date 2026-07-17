"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi, teamApi, type EventResponse } from "@/lib/api";
import { calcTotalPrizePool } from "@/features/events/utils/event-landing.utils";
import { getPrizeLabel } from "@/lib/prize.utils";

const CHART_HEIGHT = 220;

const selectStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#0e1528",
  backgroundColor: "#ffffff",
  outline: "none",
  maxWidth: 240,
  cursor: "pointer",
};

export function AdminRegistrationChart() {
  const { data: eventsPage, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-completed-events-chart"],
    queryFn: () => eventApi.list({ status: "COMPLETED", size: 50 }),
  });

  const events = eventsPage?.content ?? [];
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const {
    data: teamsPage,
    isLoading: teamsLoading,
    isError: teamsError,
  } = useQuery({
    queryKey: ["admin-competition-team-count", selectedEventId],
    queryFn: () => teamApi.list(selectedEventId, { size: 1 }),
    enabled: !!selectedEventId,
  });

  const teamCount = teamsPage?.totalElements ?? 0;
  const prizeTotal = selectedEvent ? calcTotalPrizePool(selectedEvent.prizes ?? []) : 0;
  const isLoading = eventsLoading || (!!selectedEventId && teamsLoading);

  return (
    <div
      className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(198,198,205,0.5)",
        padding: 24,
        flex: 1,
        minHeight: 340,
      }}
    >
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>
            Competition Snapshot
          </h3>
          <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4 }}>
            Teams joined and total prize pool
          </p>
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          style={selectStyle}
          disabled={events.length === 0}
          aria-label="Select competition"
        >
          {events.length === 0 ? (
            <option value="">No completed events</option>
          ) : (
            events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))
          )}
        </select>
      </div>

      {isLoading ? (
        <ChartEmpty message="Loading chart…" />
      ) : events.length === 0 ? (
        <ChartEmpty
          title="No completed competitions"
          message="Finish an event to unlock the snapshot chart."
        />
      ) : teamsError || !selectedEvent ? (
        <ChartEmpty
          title="Unable to load data"
          message="Could not load teams or prizes for this competition."
        />
      ) : (
        <CompetitionMetricsChart
          event={selectedEvent}
          teamCount={teamCount}
          prizeTotal={prizeTotal}
        />
      )}
    </div>
  );
}

function CompetitionMetricsChart({
  event,
  teamCount,
  prizeTotal,
}: {
  event: EventResponse;
  teamCount: number;
  prizeTotal: number;
}) {
  const prizeRows = (event.prizes ?? []).map((prize) => {
    const digits = prize.value.replace(/[^\d]/g, "");
    const unit = digits ? parseInt(digits, 10) : 0;
    return {
      id: prize.id,
      label: getPrizeLabel(prize.rank, prize.label),
      amount: unit * prize.quantity,
    };
  });
  const maxPrizeRow = Math.max(...prizeRows.map((r) => r.amount), 1);

  return (
    <div className="flex gap-8" style={{ minHeight: CHART_HEIGHT }}>
      <div className="flex flex-col justify-center gap-4" style={{ width: 180, flexShrink: 0 }}>
        <MetricStat
          label="Teams"
          value={formatNumber(teamCount)}
          accent="#0ea5e9"
        />
        <MetricStat
          label="Prize pool"
          value={formatVnd(prizeTotal)}
          accent="#f59e0b"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3">
        {prizeRows.length === 0 ? (
          <p style={{ fontSize: 14, color: "#8891a5" }}>No prize data for this event.</p>
        ) : (
          prizeRows.map((row) => {
            const widthPct = Math.max(6, (row.amount / maxPrizeRow) * 100);
            return (
              <div key={row.id}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#0e1528" }}>
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#8891a5",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatVnd(row.amount)}
                  </span>
                </div>
                <div
                  style={{
                    height: 18,
                    background: "rgba(223,226,236,0.45)",
                    border: "1px solid rgba(198,198,205,0.6)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${widthPct}%`,
                      background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                      borderRight: "1.5px solid #0c1228",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MetricStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        border: "1.5px solid #0c1228",
        padding: "14px 16px",
        background: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            background: accent,
            border: "1px solid #0c1228",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>{label}</span>
      </div>
      <p
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#0e1528",
          lineHeight: 1.2,
          fontVariantNumeric: "tabular-nums",
          wordBreak: "break-word",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartEmpty({
  title,
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: CHART_HEIGHT }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="4" y="28" width="8" height="16" rx="2" fill="rgba(223,226,236,0.8)" />
        <rect x="16" y="16" width="8" height="28" rx="2" fill="rgba(223,226,236,0.8)" />
        <rect x="28" y="22" width="8" height="22" rx="2" fill="rgba(223,226,236,0.8)" />
        <rect x="40" y="8" width="4" height="36" rx="2" fill="rgba(223,226,236,0.8)" />
      </svg>
      {title ? (
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528", marginTop: 16 }}>
          {title}
        </p>
      ) : null}
      <p style={{ fontSize: 14, color: "#8891a5", marginTop: title ? 4 : 16 }}>{message}</p>
    </div>
  );
}

function formatNumber(count: number): string {
  return new Intl.NumberFormat("vi-VN").format(count);
}

function formatVnd(amount: number): string {
  if (amount <= 0) return "0 ₫";
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}
