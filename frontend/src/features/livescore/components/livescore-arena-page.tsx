"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLiveScoreBoard,
  useLiveScoreWebSocket,
  useLockScores,
  usePublishResults,
  useToggleLeaderboardPublic,
} from "../hooks/use-livescore";
import { useRecalculateRankings } from "@/features/rankings/hooks/use-ranking";
import {
  useFinalists,
  useContestedFinalistSlots,
  useSelectFinalists,
} from "@/features/coordinator/hooks/use-finalists";
import { useTeamAwards, useAssignAwards } from "@/features/coordinator/hooks/use-awards";
import type { LiveScoreEntry, LiveScoreBoard, RankingEvent, LiveScoreStatus, TrackInfo } from "@/lib/api/livescore.api";
import type { RoundType } from "@/lib/api/types";

const MEDAL_COLORS: Record<number, string> = { 1: "#f59e0b", 2: "#8891a5", 3: "#cd7f32" };

const STATUS_LABELS: Record<LiveScoreStatus, { label: string; color: string; bg: string }> = {
  NOT_SUBMITTED: { label: "Not submitted", color: "#991b1b", bg: "#fee2e2" },
  WAITING_FOR_SCORE: { label: "Waiting for score", color: "#92400e", bg: "#fef3c7" },
  PARTIALLY_SCORED: { label: "Partially scored", color: "#1e40af", bg: "#dbeafe" },
  FULLY_SCORED: { label: "Fully scored", color: "#065f46", bg: "#d1fae5" },
  LOCKED: { label: "Locked", color: "#6b21a8", bg: "#f3e8ff" },
  PUBLISHED: { label: "Published", color: "#0e1528", bg: "#e2e8f0" },
};

type RowAnimation = { direction: "up" | "down"; delta: number; enteredTop3: boolean };

function MedalBadge({ rank }: { rank: number }) {
  const color = MEDAL_COLORS[rank];
  if (!color) return <span style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>{rank}</span>;
  return (
    <div className="flex items-center justify-center rounded-full" style={{ width: 32, height: 32, backgroundColor: color, flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{rank}</span>
    </div>
  );
}

function RankMovement({ current, previous, animation }: { current: number; previous: number | null; animation?: RowAnimation }) {
  if (animation) {
    const color = animation.direction === "up" ? "#16a34a" : "#dc2626";
    const sign = animation.direction === "up" ? "+" : "";
    return (
      <span style={{ fontSize: 13, fontWeight: 700, color }}>
        {sign}{animation.delta}
      </span>
    );
  }
  if (previous === null) return null;
  const diff = previous - current;
  if (diff === 0) return <span style={{ fontSize: 12, color: "#8891a5" }}>-</span>;
  if (diff > 0)
    return <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>+{diff}</span>;
  return <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>{diff}</span>;
}

function StatusBadge({ status }: { status: LiveScoreStatus }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "#0e1528", bg: "#f1f5f9" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: s.color, backgroundColor: s.bg, padding: "3px 8px", borderRadius: 4 }}>
      {s.label}
    </span>
  );
}

function LeaderToast({ teamName, onDismiss }: { teamName: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 8000,
        padding: "14px 28px",
        borderRadius: 12,
        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        border: "2px solid #f59e0b",
        boxShadow: "0 8px 32px rgba(245,158,11,0.4)",
        animation: "spotlightPulse 2s ease-in-out infinite",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 700, color: "#92400e" }}>
        {"\u{1F451}"} New Leader: {teamName}
      </span>
    </div>
  );
}

function EventNotification({ event }: { event: RankingEvent }) {
  let message = "";
  if (event.type === "NEW_LEADER") message = `New Leader: ${event.teamName}!`;
  else if (event.type === "RANK_CHANGED") {
    const dir = (event.oldRank ?? 0) > (event.newRank ?? 0) ? "climbed to" : "dropped to";
    message = `${event.teamName} ${dir} #${event.newRank}`;
  } else if (event.type === "FINAL_RESULTS_PUBLISHED") message = "Final results published!";
  else message = "Leaderboard updated";

  const bgColors: Record<string, string> = {
    NEW_LEADER: "#fef3c7",
    RANK_CHANGED: "#dbeafe",
    LEADERBOARD_UPDATED: "#f1f5f9",
    FINAL_RESULTS_PUBLISHED: "#d1fae5",
  };
  const borderColors: Record<string, string> = {
    NEW_LEADER: "#f59e0b",
    RANK_CHANGED: "#3b82f6",
    LEADERBOARD_UPDATED: "#8891a5",
    FINAL_RESULTS_PUBLISHED: "#16a34a",
  };

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        backgroundColor: bgColors[event.type] ?? "#f1f5f9",
        borderLeft: `3px solid ${borderColors[event.type] ?? "#8891a5"}`,
        fontSize: 13,
        fontWeight: 500,
        color: "#0e1528",
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {message}
    </div>
  );
}

function ConfettiOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#f59e0b", "#3b82f6", "#16a34a", "#dc2626", "#8b5cf6", "#ec4899"];
    const particles: { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rot: number; vr: number }[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
      });
    }

    let animId: number;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.05;
        if (p.y < canvas!.height + 20) alive = true;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      if (alive) animId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 9999 }}
    />
  );
}

interface RevealSegment {
  label: string;
  rankings: LiveScoreEntry[];
}

function ResultReveal({ segments, maxScore, onDone }: { segments: RevealSegment[]; maxScore: number; onDone: () => void }) {
  const [segmentIdx, setSegmentIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const segment = segments[segmentIdx];
  const top3 = segment?.rankings.filter((r) => r.rank <= 3).sort((a, b) => b.rank - a.rank) ?? [];

  useEffect(() => {
    if (phase === 0) {
      if (countdown > 0) {
        const t = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase(1), 0);
      return () => clearTimeout(t);
    } else if (phase >= 1 && phase <= 3) {
      const t = setTimeout(() => setPhase(phase + 1), 3000);
      return () => clearTimeout(t);
    } else if (phase === 4) {
      if (segmentIdx < segments.length - 1) {
        const t = setTimeout(() => {
          setSegmentIdx(segmentIdx + 1);
          setPhase(0);
          setCountdown(3);
        }, 2000);
        return () => clearTimeout(t);
      }
      const t = setTimeout(onDone, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, countdown, onDone, segmentIdx, segments.length]);

  const placeLabels = ["", "Third Place", "Second Place", "Champion"];
  const placeColors = ["", "#cd7f32", "#8891a5", "#f59e0b"];
  const isChampion = phase === 3;
  const isLastSegment = segmentIdx === segments.length - 1;

  if (phase === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9000 }}>
        {segment && (
          <span style={{ fontSize: 20, fontWeight: 600, color: "#94a3b8", marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>
            {segment.label}
          </span>
        )}
        <span style={{ fontSize: 120, fontWeight: 900, color: "#fff", animation: "pulse 1s infinite" }}>
          {countdown}
        </span>
      </div>
    );
  }

  const currentIdx = phase - 1;
  const team = top3[currentIdx];

  return (
    <div className="flex flex-col items-center justify-center" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9000 }}>
      {isChampion && isLastSegment && <ConfettiOverlay />}
      {segment && phase === 1 && (
        <span style={{ fontSize: 16, fontWeight: 600, color: "#64748b", marginBottom: 16, textTransform: "uppercase", letterSpacing: 2 }}>
          {segment.label}
        </span>
      )}
      {team && (
        <div className="flex flex-col items-center gap-4" style={{ animation: "scaleIn 0.5s ease-out" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: placeColors[phase], textTransform: "uppercase", letterSpacing: 2 }}>
            {placeLabels[phase]}
          </span>
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: isChampion ? 100 : 72,
              height: isChampion ? 100 : 72,
              backgroundColor: placeColors[phase],
              boxShadow: isChampion ? `0 0 60px ${placeColors[phase]}, 0 0 120px rgba(245,158,11,0.3)` : undefined,
            }}
          >
            <span style={{ fontSize: isChampion ? 36 : 28, fontWeight: 900, color: "#fff" }}>
              {team.rank}
            </span>
          </div>
          <span style={{ fontSize: isChampion ? 40 : 28, fontWeight: 800, color: "#fff" }}>
            {team.teamName}
          </span>
          <span style={{ fontSize: 20, fontWeight: 600, color: "#94a3b8" }}>
            {team.finalScore.toFixed(2)}
            <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 400 }}>/{maxScore}</span>
          </span>
          {team.trackName && (
            <span style={{ fontSize: 14, color: "#64748b" }}>{team.trackName}</span>
          )}
        </div>
      )}
      {phase === 4 && isLastSegment && (
        <button
          onClick={onDone}
          style={{ marginTop: 32, padding: "10px 24px", backgroundColor: "#fff", color: "#0e1528", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Back to Leaderboard
        </button>
      )}
    </div>
  );
}


function buildRevealSegments(board: LiveScoreBoard, allRankings: LiveScoreEntry[]): RevealSegment[] {
  if (board.tracks.length <= 1) {
    return [{ label: board.roundName, rankings: allRankings }];
  }
  const segments: RevealSegment[] = board.tracks.map((track) => ({
    label: track.name,
    rankings: allRankings.filter((r) => r.trackId === track.id),
  }));
  segments.push({ label: "Overall", rankings: allRankings });
  return segments.filter((s) => s.rankings.length > 0);
}

function CompetitionProgressOverview({ board }: { board: LiveScoreBoard }) {
  const rankings = board.rankings;
  const total = rankings.length;
  const notSubmitted = rankings.filter((r) => r.scoreStatus === "NOT_SUBMITTED").length;
  const waitingScore = rankings.filter((r) => r.scoreStatus === "WAITING_FOR_SCORE").length;
  const fullyScored = rankings.filter((r) => r.scoreStatus === "FULLY_SCORED").length;
  const locked = rankings.filter((r) => r.scoreStatus === "LOCKED").length;
  const published = rankings.filter((r) => r.scoreStatus === "PUBLISHED").length;
  const scored = fullyScored + locked + published;
  const progressPct = total > 0 ? Math.round((scored / total) * 100) : 0;

  const statCards = [
    { label: "Total Teams", value: total, color: "#0e1528", bg: "#eef0f6" },
    { label: "Fully Scored", value: scored, color: STATUS_LABELS.FULLY_SCORED.color, bg: STATUS_LABELS.FULLY_SCORED.bg },
    { label: "Waiting", value: waitingScore, color: STATUS_LABELS.WAITING_FOR_SCORE.color, bg: STATUS_LABELS.WAITING_FOR_SCORE.bg },
    { label: "Not Submitted", value: notSubmitted, color: STATUS_LABELS.NOT_SUBMITTED.color, bg: STATUS_LABELS.NOT_SUBMITTED.bg },
  ];

  const byTrack =
    board.tracks.length > 1
      ? board.tracks.map((track) => ({
          ...track,
          entries: board.rankings.filter((r) => r.trackId === track.id),
        }))
      : [];

  const trackColStyle: React.CSSProperties = { flex: 1, padding: "12px 14px", fontSize: 13 };
  const trackHeaderColStyle: React.CSSProperties = {
    flex: 1,
    padding: "12px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "#8891a5",
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Competition Progress Overview</h2>

      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(198,198,205,0.5)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div className="flex gap-3" style={{ marginBottom: 16 }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                flex: 1,
                backgroundColor: card.bg,
                borderRadius: 8,
                padding: "12px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 6 }}>
            {scored}/{total} teams scored ({progressPct}% complete)
          </p>
          <div style={{ height: 8, backgroundColor: "#eef0f6", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                backgroundColor: "#0c1228",
                borderRadius: 4,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {byTrack.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 8 }}>Per-Track Breakdown</h3>
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(198,198,205,0.5)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div className="flex" style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(198,198,205,0.5)" }}>
              <div style={{ ...trackHeaderColStyle, flex: 2, textAlign: "left" }}>Track Name</div>
              <div style={{ ...trackHeaderColStyle, textAlign: "center" }}>Teams</div>
              <div style={{ ...trackHeaderColStyle, textAlign: "center" }}>Fully Scored</div>
              <div style={{ ...trackHeaderColStyle, textAlign: "center" }}>Waiting</div>
              <div style={{ ...trackHeaderColStyle, textAlign: "center", flex: 1.5 }}>Judges Progress</div>
            </div>
            {byTrack.map((track, idx) => {
              const entries = track.entries;
              const teamCount = entries.length;
              const fullyScoredInTrack = entries.filter(
                (e) =>
                  e.scoreStatus === "FULLY_SCORED" ||
                  e.scoreStatus === "LOCKED" ||
                  e.scoreStatus === "PUBLISHED"
              ).length;
              const waitingInTrack = entries.filter((e) => e.scoreStatus === "WAITING_FOR_SCORE").length;
              const judgesScored = entries.reduce((sum, e) => sum + e.judgesScored, 0);
              const judgesAssigned = entries.reduce((sum, e) => sum + e.judgesAssigned, 0);

              return (
                <div
                  key={track.id}
                  className="flex"
                  style={{
                    borderBottom: idx < byTrack.length - 1 ? "1px solid rgba(198,198,205,0.3)" : "none",
                  }}
                >
                  <div style={{ ...trackColStyle, flex: 2, fontWeight: 600, color: "#0e1528" }}>{track.name}</div>
                  <div style={{ ...trackColStyle, textAlign: "center" }}>{teamCount}</div>
                  <div style={{ ...trackColStyle, textAlign: "center" }}>
                    {fullyScoredInTrack}/{teamCount}
                  </div>
                  <div style={{ ...trackColStyle, textAlign: "center" }}>{waitingInTrack}</div>
                  <div style={{ ...trackColStyle, textAlign: "center", flex: 1.5, color: "#8891a5" }}>
                    {judgesScored}/{judgesAssigned} judges scored
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type StepStatus = "pending" | "active" | "done";

const PRIZE_PREVIEW = [
  { label: "First Place", value: "7,000,000 VND" },
  { label: "Second Place", value: "5,000,000 VND" },
  { label: "Third Place", value: "3,000,000 VND" },
  { label: "Encouragement", value: "1,500,000 VND" },
];

function panelBtnStyle(bg: string, disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: bg,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

function StepBlock({
  number,
  title,
  status,
  children,
}: {
  number: number;
  title: string;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const styles: Record<StepStatus, { border: string; bg: string; circle: string; titleColor: string; titleWeight: number }> = {
    pending: { border: "#d1d5db", bg: "#f9fafb", circle: "#d1d5db", titleColor: "#8891a5", titleWeight: 400 },
    active: { border: "#0e7490", bg: "#ecfeff", circle: "#0e7490", titleColor: "#0e1528", titleWeight: 700 },
    done: { border: "#16a34a", bg: "#f0fdf4", circle: "#16a34a", titleColor: "#0e1528", titleWeight: 700 },
  };
  const s = styles[status];

  return (
    <div
      style={{
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: status !== "pending" && children ? 8 : 0 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: s.circle,
            flexShrink: 0,
          }}
        >
          {status === "done" ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>✓</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: status === "pending" ? "#fff" : "#fff" }}>{number}</span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: s.titleWeight, color: s.titleColor }}>{title}</span>
      </div>
      {status !== "pending" && children}
    </div>
  );
}

function PublishResultsBlock({
  board,
  onPublish,
  onTogglePublic,
  publishPending,
  publicPending,
}: {
  board: LiveScoreBoard;
  onPublish: () => void;
  onTogglePublic: () => void;
  publishPending: boolean;
  publicPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {!board.resultsPublished && board.roundId && (
        <button
          onClick={onPublish}
          disabled={publishPending}
          style={panelBtnStyle("#16a34a", publishPending)}
        >
          {publishPending ? "Publishing..." : "Publish Results"}
        </button>
      )}
      {board.resultsPublished && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#065f46",
            backgroundColor: "#d1fae5",
            padding: "4px 8px",
            borderRadius: 4,
            display: "inline-block",
            width: "fit-content",
          }}
        >
          Results published
        </span>
      )}
      <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#0e1528" }}>Leaderboard public</span>
        <button
          onClick={onTogglePublic}
          disabled={publicPending}
          style={{
            ...panelBtnStyle("#1e40af", publicPending),
            width: "auto",
            padding: "4px 10px",
            fontSize: 11,
          }}
        >
          {board.leaderboardPublic ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}

function FinalistsPanel({ eventId }: { eventId: string }) {
  const { data: finalists = [] } = useFinalists(eventId);
  const { data: contested = [] } = useContestedFinalistSlots(eventId);
  const selectMutation = useSelectFinalists(eventId);

  const hasFinalists = finalists.length > 0;
  const byTrack = finalists.reduce<Record<string, typeof finalists>>((acc, f) => {
    const key = f.trackName ?? "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  return (
    <StepBlock number={2} title="Select Finalists" status={hasFinalists ? "done" : "active"}>
      {!hasFinalists ? (
        <>
          <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 8, lineHeight: 1.4 }}>
            Auto-proposes top 2 per track → 6 finalists total. Ties create a contested slot.
          </p>
          <button
            onClick={() => selectMutation.mutate()}
            disabled={selectMutation.isPending}
            style={panelBtnStyle("#0e7490", selectMutation.isPending)}
          >
            {selectMutation.isPending ? "Selecting..." : "Auto-Select Finalists"}
          </button>
        </>
      ) : (
        <>
          {Object.entries(byTrack).map(([trackName, teams]) => (
            <div key={trackName} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>{trackName}</p>
              {teams.map((f) => (
                <div key={f.id} className="flex items-center gap-2" style={{ fontSize: 12, marginBottom: 2 }}>
                  <span style={{ color: "#8891a5", minWidth: 20 }}>#{f.preliminaryRank}</span>
                  <span style={{ fontWeight: 500, color: "#0e1528" }}>{f.teamName}</span>
                  {f.selectionMethod === "OVERFLOW_FILL" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#92400e",
                        backgroundColor: "#fef3c7",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      Wildcard
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {contested.length > 0 && (
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: 6,
                padding: "8px 10px",
                marginBottom: 8,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
                {contested.length} contested slot(s) — tie-break needed
              </p>
              {contested.map((slot) => (
                <p key={slot.id} style={{ fontSize: 11, color: "#92400e", marginBottom: 2 }}>
                  {slot.trackName ?? "Track"}: {slot.teams.map((t) => t.teamName).join(" vs ")}
                </p>
              ))}
            </div>
          )}
          <button
            onClick={() => selectMutation.mutate()}
            disabled={selectMutation.isPending}
            style={panelBtnStyle("#0e7490", selectMutation.isPending)}
          >
            {selectMutation.isPending ? "Selecting..." : "Re-select Finalists"}
          </button>
        </>
      )}
    </StepBlock>
  );
}

function AwardsPanel({ eventId, rankings }: { eventId: string; rankings: LiveScoreEntry[] }) {
  const { data: awards = [] } = useTeamAwards(eventId);
  const assignMutation = useAssignAwards(eventId);

  const hasAwards = awards.length > 0;
  const top4 = rankings.slice(0, 4);

  return (
    <StepBlock number={3} title="Assign Awards" status={hasAwards ? "done" : "active"}>
      {!hasAwards ? (
        <>
          <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 8 }}>
            Preview — will be auto-assigned from final rankings:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8, fontSize: 11 }}>
            <tbody>
              {PRIZE_PREVIEW.map((prize, idx) => (
                <tr key={prize.label} style={{ borderBottom: "1px solid rgba(198,198,205,0.3)" }}>
                  <td style={{ padding: "4px 0", color: "#8891a5", width: "40%" }}>{prize.label}</td>
                  <td style={{ padding: "4px 4px", fontWeight: 500, color: "#0e1528" }}>
                    {top4[idx]?.teamName ?? "TBD"}
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#0e1528" }}>{prize.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            style={panelBtnStyle("#16a34a", assignMutation.isPending)}
          >
            {assignMutation.isPending ? "Assigning..." : "Assign Awards"}
          </button>
          {assignMutation.isError && (
            <p style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
              Failed to assign. Ensure rankings are recalculated first.
            </p>
          )}
        </>
      ) : (
        <>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#065f46",
              backgroundColor: "#d1fae5",
              padding: "4px 8px",
              borderRadius: 4,
              display: "inline-block",
              marginBottom: 8,
            }}
          >
            Awards assigned
          </span>
          {awards.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between"
              style={{ fontSize: 12, marginBottom: 4, gap: 4 }}
            >
              <span style={{ color: "#8891a5", flex: 1 }}>{a.prizeLabel}</span>
              <span style={{ fontWeight: 500, color: "#0e1528", flex: 1 }}>{a.teamName}</span>
              <span style={{ color: "#0e1528", whiteSpace: "nowrap" }}>
                {Number(a.prizeValue).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          ))}
        </>
      )}
    </StepBlock>
  );
}

function PublishFlowPanel({
  board,
  eventId,
  fullRankings,
  onReplayReveal,
}: {
  board: LiveScoreBoard;
  eventId: string;
  fullRankings: LiveScoreEntry[];
  onReplayReveal: () => void;
}) {
  const lockMutation = useLockScores(eventId);
  const publishMutation = usePublishResults(eventId);
  const publicMutation = useToggleLeaderboardPublic(eventId);
  const recalculateMutation = useRecalculateRankings(eventId);

  const isPreliminary = board.roundType === "PRELIMINARY";
  const publishStepNumber = isPreliminary ? 3 : 2;
  const publishStepStatus: StepStatus = board.resultsPublished
    ? "done"
    : board.scoresLocked
      ? "active"
      : "pending";

  const lockStep = (
    <StepBlock number={1} title="Lock & Recalculate" status={board.scoresLocked ? "done" : "active"}>
      <div className="flex flex-col gap-2">
        {board.roundId && (
          <button
            onClick={() => recalculateMutation.mutate(board.roundId)}
            disabled={recalculateMutation.isPending}
            style={panelBtnStyle("#0e7490", recalculateMutation.isPending)}
          >
            {recalculateMutation.isPending ? "Recalculating..." : "Recalculate Rankings"}
          </button>
        )}
        {!board.scoresLocked && board.roundId && (
          <button
            onClick={() => lockMutation.mutate(board.roundId)}
            disabled={lockMutation.isPending}
            style={panelBtnStyle("#6b21a8", lockMutation.isPending)}
          >
            {lockMutation.isPending ? "Locking..." : "Lock Scores"}
          </button>
        )}
        {board.scoresLocked && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b21a8",
              backgroundColor: "#f3e8ff",
              padding: "4px 8px",
              borderRadius: 4,
              display: "inline-block",
              width: "fit-content",
            }}
          >
            Scores locked
          </span>
        )}
      </div>
    </StepBlock>
  );

  const publishStep = (
    <StepBlock number={publishStepNumber} title="Publish Results" status={publishStepStatus}>
      {board.scoresLocked ? (
        <PublishResultsBlock
          board={board}
          onPublish={() => board.roundId && publishMutation.mutate(board.roundId)}
          onTogglePublic={() => publicMutation.mutate(!board.leaderboardPublic)}
          publishPending={publishMutation.isPending}
          publicPending={publicMutation.isPending}
        />
      ) : null}
    </StepBlock>
  );

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid rgba(198,198,205,0.5)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0e1528" }}>Publish Flow</h3>
        <span style={{ fontSize: 11, color: "#8891a5" }}>{board.roundName}</span>
      </div>

      {lockStep}

      {isPreliminary ? (
        board.scoresLocked ? (
          <FinalistsPanel eventId={eventId} />
        ) : (
          <StepBlock number={2} title="Select Finalists" status="pending" />
        )
      ) : null}

      {publishStep}

      {!isPreliminary ? (
        board.resultsPublished ? (
          <AwardsPanel eventId={eventId} rankings={fullRankings} />
        ) : (
          <StepBlock number={3} title="Assign Awards" status="pending" />
        )
      ) : null}

      {board.resultsPublished && (
        <button
          onClick={onReplayReveal}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: "transparent",
            color: "#0e1528",
            border: "1px solid rgba(198,198,205,0.8)",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Replay Reveal
        </button>
      )}
    </div>
  );
}

interface LiveScoreArenaPageProps {
  eventId: string;
}

export function LiveScoreArenaPage({ eventId }: LiveScoreArenaPageProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>(undefined);
  const [roundTypeSelection, setRoundTypeSelection] = useState<RoundType | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [leaderToast, setLeaderToast] = useState<string | null>(null);
  const [rowAnimations, setRowAnimations] = useState<Map<string, RowAnimation>>(new Map());
  const prevRankingsRef = useRef<Map<string, number>>(new Map());

  const { data: board, isLoading, error } = useLiveScoreBoard(
    eventId,
    roundTypeSelection === "PRELIMINARY" ? selectedTrackId : undefined,
    undefined,
    roundTypeSelection ?? undefined,
  );
  const { data: fullBoard } = useLiveScoreBoard(
    eventId,
    undefined,
    undefined,
    roundTypeSelection ?? undefined,
  );
  const roundType = roundTypeSelection ?? board?.roundType ?? undefined;
  const { connected, rankingEvents, finalResults } = useLiveScoreWebSocket(eventId);

  const allRankings = fullBoard?.rankings ?? board?.rankings ?? [];
  const revealVisible = showReveal || Boolean(finalResults && board?.resultsPublished);

  useEffect(() => {
    if (rankingEvents.length === 0) return;
    const timer = window.setTimeout(() => {
      for (const ev of rankingEvents) {
        if (ev.type === "NEW_LEADER" && ev.teamName) {
          setLeaderToast(ev.teamName);
        }
        if (ev.type === "RANK_CHANGED" && ev.teamId && ev.newRank != null && ev.oldRank != null) {
          const delta = ev.oldRank - ev.newRank;
          if (delta !== 0) {
            setRowAnimations((prev) => {
              const next = new Map(prev);
              next.set(ev.teamId!, {
                direction: delta > 0 ? "up" : "down",
                delta: Math.abs(delta),
                enteredTop3: ev.oldRank! > 3 && ev.newRank! <= 3,
              });
              return next;
            });
            setTimeout(() => {
              setRowAnimations((prev) => {
                const next = new Map(prev);
                next.delete(ev.teamId!);
                return next;
              });
            }, 2500);
          }
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [rankingEvents]);

  useEffect(() => {
    if (!board?.rankings) return;
    const newMap = new Map<string, number>();
    for (const entry of board.rankings) {
      newMap.set(entry.teamId, entry.rank);
    }
    prevRankingsRef.current = newMap;
  }, [board?.rankings]);

  const dismissLeaderToast = useCallback(() => setLeaderToast(null), []);

  const filteredRankings = board?.rankings ?? [];
  const revealSegments = fullBoard ? buildRevealSegments(fullBoard, allRankings) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ padding: 64 }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (error) {
    const message = (error as { message?: string })?.message ?? "Unable to load leaderboard";
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ padding: 64 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>Access restricted</p>
        <p style={{ fontSize: 14, color: "#8891a5" }}>{message}</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ padding: 64 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#0e1528" }}>Event not found</p>
      </div>
    );
  }

  const hasMultipleTracks = board.tracks.length > 1;

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes glowUp { 0% { box-shadow:0 0 0 rgba(22,163,74,0); transform:translateY(8px); } 50% { box-shadow:0 0 16px rgba(22,163,74,0.3); transform:translateY(0); } 100% { box-shadow:0 0 0 rgba(22,163,74,0); transform:translateY(0); } }
        @keyframes glowDown { 0% { box-shadow:0 0 0 rgba(220,38,38,0); transform:translateY(-4px); } 50% { box-shadow:0 0 12px rgba(220,38,38,0.2); transform:translateY(0); } 100% { box-shadow:0 0 0 rgba(220,38,38,0); transform:translateY(0); } }
        @keyframes spotlightPulse { 0%,100% { box-shadow:0 8px 32px rgba(245,158,11,0.4); } 50% { box-shadow:0 8px 48px rgba(245,158,11,0.7); } }
        .rank-up { animation: glowUp 2s ease-out; }
        .rank-down { animation: glowDown 2s ease-out; }
      `}</style>

      {leaderToast && <LeaderToast teamName={leaderToast} onDismiss={dismissLeaderToast} />}

      {revealVisible && board.resultsPublished && revealSegments.length > 0 && (
        <ResultReveal
          segments={revealSegments}
          maxScore={fullBoard?.maxScore ?? board.maxScore}
          onDone={() => setShowReveal(false)}
        />
      )}

      <div className="flex flex-col gap-6" style={{ maxWidth: 1440, padding: 24 }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px" }}>
                LiveScore Arena
              </h1>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: connected ? "#16a34a" : "#dc2626",
                  display: "inline-block",
                }}
                title={connected ? "Connected" : "Disconnected"}
              />
            </div>
            <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
              {board.eventName} &middot; {board.season} {board.year} &middot; {board.roundName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {board.leaderboardPublic && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", backgroundColor: "#dbeafe", padding: "4px 10px", borderRadius: 4 }}>
                Public Mode
              </span>
            )}
            {board.scoresLocked && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b21a8", backgroundColor: "#f3e8ff", padding: "4px 10px", borderRadius: 4 }}>
                Scores Locked
              </span>
            )}
            {board.resultsPublished && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#065f46", backgroundColor: "#d1fae5", padding: "4px 10px", borderRadius: 4 }}>
                Results Published
              </span>
            )}
          </div>
        </div>

        {fullBoard && <CompetitionProgressOverview board={fullBoard} />}

        {hasMultipleTracks && roundType === "PRELIMINARY" && (
          <div className="flex gap-2" style={{ borderBottom: "1px solid rgba(198,198,205,0.5)", paddingBottom: 1 }}>
            <TrackTab label="Overall" active={!selectedTrackId} onClick={() => setSelectedTrackId(undefined)} />
            {board.tracks.map((track: TrackInfo) => (
              <TrackTab
                key={track.id}
                label={track.name}
                active={selectedTrackId === track.id}
                onClick={() => setSelectedTrackId(track.id)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-2" style={{ borderBottom: "1px solid rgba(198,198,205,0.5)", paddingBottom: 1 }}>
          <TrackTab
            label="Preliminary"
            active={roundType === "PRELIMINARY"}
            onClick={() => {
              setRoundTypeSelection("PRELIMINARY");
              setSelectedTrackId(undefined);
            }}
          />
          <TrackTab
            label="Finals"
            active={roundType === "FINAL"}
            onClick={() => {
              setRoundTypeSelection("FINAL");
              setSelectedTrackId(undefined);
            }}
          />
        </div>

        <div className="flex gap-6">
          <div style={{ flex: 1 }}>
            {filteredRankings.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
                style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
              >
                <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No rankings yet</p>
                <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
                  Rankings will appear here once teams have been scored.
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: "#fff", border: "1px solid rgba(198,198,205,0.5)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Rank</th>
                      <th style={{ ...thStyle, textAlign: "left" }}>Team</th>
                      {hasMultipleTracks && <th style={thStyle}>Track</th>}
                      <th style={thStyle}>Score</th>
                      <th style={thStyle}>Movement</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.map((entry, idx) => {
                      const anim = rowAnimations.get(entry.teamId);
                      const isUp = anim?.direction === "up" || (entry.previousRank !== null && entry.previousRank > entry.rank);
                      const isDown = anim?.direction === "down" || (entry.previousRank !== null && entry.previousRank < entry.rank);

                      return (
                        <tr
                          key={entry.teamId}
                          className={anim ? (anim.direction === "up" ? "rank-up" : "rank-down") : isUp ? "rank-up" : isDown ? "rank-down" : ""}
                          style={{
                            borderBottom: idx < filteredRankings.length - 1 ? "1px solid rgba(198,198,205,0.3)" : "none",
                            transition: "transform 0.5s ease, box-shadow 0.5s ease",
                          }}
                        >
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <MedalBadge rank={entry.rank} />
                          </td>
                          <td style={tdStyle}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: entry.rank <= 3 ? 700 : 400, color: "#0e1528" }}>
                                {entry.teamName}
                              </span>
                              {anim?.enteredTop3 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: "#1e40af", backgroundColor: "#dbeafe", padding: "2px 6px", borderRadius: 4 }}>
                                  Entered Top 3
                                </span>
                              )}
                              {entry.rank === 1 && anim?.direction === "up" && (
                                <span style={{ fontSize: 14 }}>{"\u{1F525}"}</span>
                              )}
                            </div>
                          </td>
                          {hasMultipleTracks && (
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <span style={{ fontSize: 12, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 4 }}>
                                {entry.trackName ?? "-"}
                              </span>
                            </td>
                          )}
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>
                              {entry.finalScore.toFixed(2)}
                            </span>
                            <span style={{ fontSize: 12, color: "#8891a5", marginLeft: 2 }}>/{board.maxScore}</span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <RankMovement current={entry.rank} previous={entry.previousRank} animation={anim} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <StatusBadge status={entry.scoreStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          <div style={{ width: 340, flexShrink: 0 }}>
            {board.canManageLeaderboard && (
              <PublishFlowPanel
                board={board}
                eventId={eventId}
                fullRankings={allRankings}
                onReplayReveal={() => setShowReveal(true)}
              />
            )}
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 8 }}>
              Live Updates
            </h3>
            <div className="flex flex-col gap-2" style={{ maxHeight: 600, overflowY: "auto" }}>
              {rankingEvents.filter((e) => e.type !== "LEADERBOARD_UPDATED").length === 0 ? (
                <p style={{ fontSize: 13, color: "#8891a5", textAlign: "center", padding: 16 }}>
                  No updates yet. Waiting for scores...
                </p>
              ) : (
                rankingEvents
                  .filter((e) => e.type !== "LEADERBOARD_UPDATED")
                  .map((ev, i) => <EventNotification key={i} event={ev} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TrackTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
        backgroundColor: "transparent",
        color: active ? "#0e1528" : "#8891a5",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const thStyle: React.CSSProperties = {
  backgroundColor: "#eef0f6",
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  padding: "12px 14px",
  textAlign: "center",
  borderBottom: "1px solid rgba(198,198,205,0.5)",
};

const tdStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  padding: "12px 14px",
};
