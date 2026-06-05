"use client";
/* ============================================================================
 * judging-store.ts — "kho dữ liệu" về CHẤM ĐIỂM (Team, Judge, điểm, xếp hạng).
 * ----------------------------------------------------------------------------
 * Dùng CHUNG khuôn mẫu với competition-store.ts (read/write + CustomEvent +
 * hook useJudgingStore) — xem giải thích chi tiết khuôn mẫu ở đầu file đó.
 * Khác biệt: sự kiện ở đây tên "judging-store-changed".
 *
 * Các "vai" dữ liệu chính:
 *   Round (vòng thi) · Team (đội) · Judge (giám khảo) · ScoringCriterion (tiêu chí)
 *   JudgeAssignment (phân công GK chấm đội nào) · JudgeScore (1 điểm cho 1 tiêu chí)
 *   ScoreOverride (Coordinator chỉnh tay điểm tổng) · AuditEntry (nhật ký).
 * Hàm "ngôi sao": computeRanking() — gộp điểm các GK thành bảng xếp hạng.
 * ========================================================================== */
import * as React from "react";

// Vòng đời trạng thái 1 ô điểm: chưa chấm → đang chấm → chờ duyệt → đã duyệt → đã khoá.
export type ScoringStatus = "PENDING" | "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "LOCKED";

/** Số đội tối đa 1 mentor được nhận. */
export const MAX_TEAMS_PER_MENTOR = 5;

// Chênh lệch điểm (so với điểm cũ) vượt mức này thì đánh dấu "bất thường" để soi.
export const SCORE_ANOMALY_THRESHOLD = 20;

export interface Round {
  id: string; name: string; competitionId: string; deadline: string; locked: boolean;
}
export interface Team {
  id: string; name: string; track: string; submissionId: string;
  members: string[]; mentorId?: string; github?: string; video?: string; pdf?: string;
}
export interface Judge { id: string; name: string; }
export interface JudgeAssignment {
  id: string; judgeId: string; judgeName: string;
  competitionId: string; seasonId: string; roundId: string;
  teamId: string; assignedAt: string;
}
export interface ScoringCriterion {
  id: string; roundId: string; criterionName: string; description: string;
  maxScore: number; weight: number; isActive: boolean;
}
export interface JudgeScore {
  id: string; judgeId: string; teamId: string; roundId: string; criteriaId: string;
  score: number; comment: string;
  createdAt: string; updatedAt: string;
  status: ScoringStatus;
  reviewedBy?: string; reviewedAt?: string; rejectionReason?: string;
}
export interface AuditEntry {
  id: string; userId: string; userName: string;
  action: string;
  entityType: "Score" | "Criteria" | "Assignment" | "Ranking" | "Round" | "Competition" | "User" | "Rules";
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  reason?: string;
  flagged?: boolean;
  teamName?: string;
}
export interface ScoreOverride {
  id: string;
  teamId: string;
  roundId: string;
  overrideScore: number;
  reason: string;
  by: string;
  byName: string;
  at: string;
}

const K = {
  rounds: "seal_rounds",
  teams: "seal_teams_v2",
  judges: "seal_judges",
  criteria: "seal_criteria",
  assignments: "seal_assignments",
  scores: "seal_scores",
  audit: "seal_audit_v2",
  overrides: "seal_score_overrides",
  notifications: "seal_notifications",
};

const SEED_ROUNDS: Round[] = [
  { id: "r1", name: "Qualifiers", competitionId: "c1", deadline: "2026-08-02T12:00", locked: false },
  { id: "r2", name: "Semi-finals", competitionId: "c1", deadline: "2026-08-03T18:00", locked: false },
  { id: "r3", name: "Finals", competitionId: "c1", deadline: "2026-08-04T18:00", locked: false },
];

const SEED_TEAMS: Team[] = [
  { id: "t1", name: "NeuroPilot", track: "AI/Healthcare", submissionId: "sub1", members: ["alex@seal.dev", "bob@fpt.edu.vn", "carol@fpt.edu.vn"], github: "https://github.com/example/neuropilot", video: "https://youtu.be/demo1", pdf: "neuropilot.pdf" },
  { id: "t2", name: "Quantum Coders", track: "AI/Tools", submissionId: "sub2", members: ["dan@fpt.edu.vn", "emma@fpt.edu.vn"], mentorId: "u2", github: "https://github.com/example/qc", video: "https://youtu.be/demo2" },
  { id: "t3", name: "EcoTrack", track: "Sustainability", submissionId: "sub3", members: ["frank@fpt.edu.vn", "grace@fpt.edu.vn", "henry@fpt.edu.vn"], mentorId: "u2", github: "https://github.com/example/eco" },
  { id: "t4", name: "Neural Nomads", track: "AI/Edge", submissionId: "sub4", members: ["ivy@fpt.edu.vn", "jack@fpt.edu.vn"], mentorId: "u7", github: "https://github.com/example/nn" },
  { id: "t5", name: "DataForge", track: "AI/Data", submissionId: "sub5", members: ["kate@fpt.edu.vn", "liam@fpt.edu.vn", "mia@fpt.edu.vn"], mentorId: "u7" },
  { id: "t6", name: "PixelPioneers", track: "Creative", submissionId: "sub6", members: ["noah@fpt.edu.vn", "olivia@fpt.edu.vn"], mentorId: "u7" },
];

const SEED_JUDGES: Judge[] = [
  { id: "u3", name: "Judge Linh" },
  { id: "j2", name: "Tran Quoc" },
  { id: "j3", name: "Pham Hai" },
  { id: "j4", name: "Nguyen Vy" },
];

function makeCriteria(): ScoringCriterion[] {
  const base = [
    { name: "Innovation", weights: [0.25, 0.25, 0.2], desc: "Originality and creative leap." },
    { name: "Technical Implementation", weights: [0.3, 0.3, 0.25], desc: "Engineering quality, robustness, scalability." },
    { name: "UI/UX", weights: [0.15, 0.15, 0.15], desc: "Usability, polish, accessibility." },
    { name: "Business Potential", weights: [0.15, 0.15, 0.2], desc: "Market fit and monetisation." },
    { name: "Presentation", weights: [0.15, 0.15, 0.2], desc: "Clarity of pitch and Q&A." },
  ];
  const out: ScoringCriterion[] = [];
  ["r1", "r2", "r3"].forEach((rid, ri) => {
    base.forEach((b, bi) => {
      out.push({
        id: `${rid}-c${bi + 1}`, roundId: rid, criterionName: b.name, description: b.desc,
        maxScore: 10, weight: b.weights[ri], isActive: true,
      });
    });
  });
  return out;
}

function makeAssignments(): JudgeAssignment[] {
  const out: JudgeAssignment[] = [];
  let i = 0;
  for (const j of SEED_JUDGES) {
    for (const rid of ["r1", "r2", "r3"]) {
      for (const t of SEED_TEAMS) {
        out.push({
          id: `a${++i}`, judgeId: j.id, judgeName: j.name,
          competitionId: "c1", seasonId: "s2026-summer", roundId: rid,
          teamId: t.id, assignedAt: "2026-07-28T10:00",
        });
      }
    }
  }
  return out;
}

function makeScores(criteria: ScoringCriterion[]): JudgeScore[] {
  const baseline: Record<string, number> = { t1: 7.8, t2: 7.4, t3: 8.4, t4: 8.7, t5: 7.1, t6: 6.9 };
  const out: JudgeScore[] = [];
  let id = 0;
  SEED_JUDGES.forEach((j, ji) => {
    ["r1", "r2"].forEach((rid) => {
      const roundCrit = criteria.filter((c) => c.roundId === rid);
      SEED_TEAMS.forEach((t) => {
        roundCrit.forEach((c, idx) => {
          const jitter = (((ji * 3 + idx * 2) % 9) - 4) / 10;
          const raw = Math.max(0, Math.min(10, baseline[t.id] + jitter));
          out.push({
            id: `s${++id}`, judgeId: j.id, teamId: t.id, roundId: rid, criteriaId: c.id,
            score: Number(raw.toFixed(1)), comment: "",
            createdAt: "2026-08-02T13:00", updatedAt: "2026-08-02T13:00",
            status: "APPROVED",
          });
        });
      });
    });
  });
  return out;
}

const SEED_NOTIFICATIONS = [
  { id: "n1", title: "Welcome to SEAL Summer 2026", body: "Registration is now open until July 25.", type: "info" as const, at: "2026-06-01T08:00" },
  { id: "n2", title: "Round 1 deadline approaching", body: "Submit your MVP before Aug 2, 12:00.", type: "warning" as const, at: "2026-08-01T20:00" },
  { id: "n3", title: "Calibration completed", body: "All judges have passed calibration. Scoring is now unlocked.", type: "success" as const, at: "2026-08-02T07:30" },
];

const SEED_AUDIT: AuditEntry[] = [
  {
    id: "au-seed-1", userId: "u5", userName: "Admin Root",
    action: "Adjusted team weighted score",
    entityType: "Score", entityId: "t3-r2",
    oldValue: "78.20", newValue: "84.50",
    timestamp: "2026-08-03T19:12:00Z",
    reason: "Recount after judge calibration", flagged: false, teamName: "EcoTrack",
  },
  {
    id: "au-seed-2", userId: "u5", userName: "Admin Root",
    action: "Adjusted team weighted score",
    entityType: "Score", entityId: "t1-r3",
    oldValue: "72.10", newValue: "96.40",
    timestamp: "2026-08-04T20:01:00Z",
    reason: "Bonus for ethics innovation per BTC ruling", flagged: true, teamName: "NeuroPilot",
  },
  {
    id: "au-seed-3", userId: "u5", userName: "Admin Root",
    action: "Adjusted team weighted score",
    entityType: "Score", entityId: "t2-r2",
    oldValue: "81.00", newValue: "55.00",
    timestamp: "2026-08-03T22:45:00Z",
    reason: "", flagged: true, teamName: "Quantum Coders",
  },
  {
    id: "au-seed-4", userId: "u4", userName: "Coord Minh",
    action: "Locked round Finals",
    entityType: "Round", entityId: "r3",
    oldValue: "false", newValue: "true",
    timestamp: "2026-08-04T18:30:00Z",
  },
  {
    id: "au-seed-5", userId: "u4", userName: "Coord Minh",
    action: "Approved score",
    entityType: "Score", entityId: "s123",
    oldValue: "PENDING_REVIEW", newValue: "APPROVED",
    timestamp: "2026-08-03T15:10:00Z",
  },
  {
    id: "au-seed-6", userId: "u5", userName: "Admin Root",
    action: "Adjusted team weighted score",
    entityType: "Score", entityId: "t4-r3",
    oldValue: "88.30", newValue: "62.10",
    timestamp: "2026-08-04T21:20:00Z",
    reason: "", flagged: true, teamName: "Neural Nomads",
  },
];

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw) as T; } catch { return seed; }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("judging-store-changed"));
}

export function getRounds() { return read<Round[]>(K.rounds, SEED_ROUNDS); }
export function getTeams() { return read<Team[]>(K.teams, SEED_TEAMS); }
export function getJudges() { return read<Judge[]>(K.judges, SEED_JUDGES); }
export function getCriteria() { return read<ScoringCriterion[]>(K.criteria, makeCriteria()); }
export function getAssignments() { return read<JudgeAssignment[]>(K.assignments, makeAssignments()); }
export function getScores() {
  const c = getCriteria();
  const raw = read<JudgeScore[]>(K.scores, makeScores(c));
  // Migrate legacy REJECTED state → APPROVED (reject flow removed).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return raw.map((s) => ((s.status as any) === "REJECTED" ? { ...s, status: "APPROVED" as const } : s));
}
export function getAudit() { return read<AuditEntry[]>(K.audit, SEED_AUDIT); }
export function getScoreOverrides() { return read<ScoreOverride[]>(K.overrides, []); }
export function getNotifications() { return read<typeof SEED_NOTIFICATIONS>(K.notifications, SEED_NOTIFICATIONS); }

export function setTeamMentor(teamId: string, mentorId: string | undefined) {
  const all = getTeams();
  if (mentorId) {
    const count = all.filter((t) => t.mentorId === mentorId && t.id !== teamId).length;
    if (count >= MAX_TEAMS_PER_MENTOR) {
      throw new Error(`Mentor đã đạt giới hạn ${MAX_TEAMS_PER_MENTOR} đội.`);
    }
  }
  write(K.teams, all.map((t) => (t.id === teamId ? { ...t, mentorId } : t)));
}

export function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const audit = getAudit();
  const e: AuditEntry = { ...entry, id: `au${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString() };
  write(K.audit, [e, ...audit].slice(0, 500));
}

/** Add rounds for a new competition. Called by competition-store on create. */
export function addRoundsForCompetition(competitionId: string, rounds: { id: string; name: string; deadline: string }[]) {
  const all = getRounds();
  const additions: Round[] = rounds
    .filter((r) => !all.some((x) => x.id === r.id))
    .map((r) => ({ id: r.id, name: r.name, competitionId, deadline: r.deadline, locked: false }));
  if (additions.length === 0) return;
  write(K.rounds, [...all, ...additions]);
}

export function upsertScore(input: {
  judgeId: string; judgeName: string; teamId: string; roundId: string; criteriaId: string;
  score: number; comment: string;
}) {
  const all = getScores();
  const existing = all.find((s) => s.judgeId === input.judgeId && s.teamId === input.teamId && s.roundId === input.roundId && s.criteriaId === input.criteriaId);
  const now = new Date().toISOString();
  let next: JudgeScore[];
  if (existing) {
    const updated: JudgeScore = { ...existing, score: input.score, comment: input.comment, status: "PENDING_REVIEW", updatedAt: now };
    next = all.map((s) => (s.id === existing.id ? updated : s));
    logAudit({
      userId: input.judgeId, userName: input.judgeName,
      action: "Updated score (pending review)",
      entityType: "Score", entityId: existing.id,
      oldValue: `${existing.score}`, newValue: `${input.score}`,
    });
  } else {
    const created: JudgeScore = {
      id: `s${Date.now()}`, judgeId: input.judgeId, teamId: input.teamId, roundId: input.roundId, criteriaId: input.criteriaId,
      score: input.score, comment: input.comment, createdAt: now, updatedAt: now, status: "PENDING_REVIEW",
    };
    next = [...all, created];
    logAudit({
      userId: input.judgeId, userName: input.judgeName,
      action: "Submitted score (pending review)",
      entityType: "Score", entityId: created.id,
      oldValue: null, newValue: `${input.score}`,
    });
  }
  write(K.scores, next);
}

export function approveScore(scoreId: string, reviewer: { id: string; name: string }) {
  const all = getScores();
  const next = all.map((s) => s.id === scoreId ? { ...s, status: "APPROVED" as const, reviewedBy: reviewer.id, reviewedAt: new Date().toISOString() } : s);
  write(K.scores, next);
  const s = all.find((x) => x.id === scoreId);
  logAudit({ userId: reviewer.id, userName: reviewer.name, action: "Approved score", entityType: "Score", entityId: scoreId, oldValue: s ? s.status : null, newValue: "APPROVED" });
}
/** @deprecated Reject flow has been removed. Use approveScore only. */
export function rejectScore(_scoreId: string, _reason: string, _reviewer: { id: string; name: string }) {
  /* no-op */
}

export function addAssignment(a: Omit<JudgeAssignment, "id" | "assignedAt">, actor: { id: string; name: string }) {
  const all = getAssignments();
  const exists = all.some((x) => x.judgeId === a.judgeId && x.teamId === a.teamId && x.roundId === a.roundId);
  if (exists) return;
  const e: JudgeAssignment = { ...a, id: `a${Date.now()}`, assignedAt: new Date().toISOString() };
  write(K.assignments, [...all, e]);
  logAudit({ userId: actor.id, userName: actor.name, action: `Assigned ${a.judgeName} → team ${a.teamId} (${a.roundId})`, entityType: "Assignment", entityId: e.id, oldValue: null, newValue: JSON.stringify(a) });
}
export function removeAssignment(id: string, actor: { id: string; name: string }) {
  const all = getAssignments();
  const target = all.find((a) => a.id === id);
  if (!target) return;
  write(K.assignments, all.filter((a) => a.id !== id));
  logAudit({ userId: actor.id, userName: actor.name, action: `Removed assignment for ${target.judgeName}`, entityType: "Assignment", entityId: id, oldValue: JSON.stringify(target), newValue: null });
}

export function addCriterion(c: Omit<ScoringCriterion, "id">, actor: { id: string; name: string }) {
  const all = getCriteria();
  const e: ScoringCriterion = { ...c, id: `c${Date.now()}` };
  write(K.criteria, [...all, e]);
  logAudit({ userId: actor.id, userName: actor.name, action: `Added criterion ${c.criterionName}`, entityType: "Criteria", entityId: e.id, oldValue: null, newValue: JSON.stringify(c) });
}
export function removeCriterion(id: string, actor: { id: string; name: string }) {
  const all = getCriteria();
  const target = all.find((c) => c.id === id);
  if (!target) return;
  write(K.criteria, all.filter((c) => c.id !== id));
  logAudit({ userId: actor.id, userName: actor.name, action: `Removed criterion ${target.criterionName}`, entityType: "Criteria", entityId: id, oldValue: JSON.stringify(target), newValue: null });
}

export function setRoundLocked(roundId: string, locked: boolean, actor: { id: string; name: string }) {
  const all = getRounds();
  const target = all.find((r) => r.id === roundId);
  if (!target) return;
  write(K.rounds, all.map((r) => r.id === roundId ? { ...r, locked } : r));
  logAudit({ userId: actor.id, userName: actor.name, action: `${locked ? "Locked" : "Unlocked"} round ${target.name}`, entityType: "Round", entityId: roundId, oldValue: String(target.locked), newValue: String(locked) });
}

export function adjustTeamScore(input: {
  teamId: string; teamName: string; roundId: string;
  oldScore: number; newScore: number; reason: string;
  actor: { id: string; name: string };
}): { ok: true; flagged: boolean } | { ok: false; error: string } {
  if (!input.reason || input.reason.trim() === "") {
    return { ok: false, error: "Lý do là bắt buộc — không thể chỉnh điểm khi chưa nhập lý do." };
  }
  if (Number.isNaN(input.newScore) || input.newScore < 0 || input.newScore > 100) {
    return { ok: false, error: "Điểm phải nằm trong khoảng 0–100." };
  }
  const diff = Math.abs(input.newScore - input.oldScore);
  const flagged = diff > SCORE_ANOMALY_THRESHOLD;
  const all = getScoreOverrides();
  const existing = all.find((o) => o.teamId === input.teamId && o.roundId === input.roundId);
  const next: ScoreOverride = {
    id: existing?.id ?? `ov${Date.now()}`,
    teamId: input.teamId, roundId: input.roundId,
    overrideScore: input.newScore, reason: input.reason.trim(),
    by: input.actor.id, byName: input.actor.name, at: new Date().toISOString(),
  };
  const merged = existing ? all.map((o) => (o.id === existing.id ? next : o)) : [...all, next];
  write(K.overrides, merged);
  logAudit({
    userId: input.actor.id, userName: input.actor.name,
    action: "Adjusted team weighted score",
    entityType: "Score", entityId: `${input.teamId}-${input.roundId}`,
    oldValue: input.oldScore.toFixed(2), newValue: input.newScore.toFixed(2),
    reason: input.reason.trim(), flagged, teamName: input.teamName,
  });
  return { ok: true, flagged };
}

export interface RankingRow {
  teamId: string; teamName: string; track: string;
  weighted: number; average: number; judgesCount: number;
  overridden?: boolean;
}

/**
 * computeRanking() — tính BẢNG XẾP HẠNG của 1 vòng thi.
 * Các bước:
 *   1) Lấy các tiêu chí đang bật của vòng + tổng trọng số của chúng.
 *   2) Lọc các điểm thuộc vòng này (mặc định chỉ tính điểm đã APPROVED).
 *   3) Với mỗi điểm: đổi về thang 100 (normalized) rồi nhân trọng số → "weighted".
 *      Gom theo từng đội, trong đội gom theo từng giám khảo.
 *   4) Điểm cuối của đội = TRUNG BÌNH điểm weighted của các giám khảo.
 *   5) Nếu Coordinator có "override" (chỉnh tay) thì dùng điểm đó thay thế.
 *   6) Sắp xếp giảm dần theo điểm → vị trí 1, 2, 3...
 * Trả về mảng RankingRow (đã xếp hạng).
 */
export function computeRanking(
  scores: JudgeScore[],
  criteria: ScoringCriterion[],
  roundId: string,
  opts: { includeOnlyApproved: boolean } = { includeOnlyApproved: true },
): RankingRow[] {
  // (1) tiêu chí đang bật của vòng + tổng trọng số (||1 để tránh chia cho 0)
  const roundCrit = criteria.filter((c) => c.roundId === roundId && c.isActive);
  const totalWeight = roundCrit.reduce((s, c) => s + c.weight, 0) || 1;
  // (2) lọc điểm của vòng; mặc định chỉ lấy điểm đã duyệt (APPROVED)
  const filtered = scores.filter((s) => s.roundId === roundId && (!opts.includeOnlyApproved || s.status === "APPROVED"));
  const teams = getTeams();
  const overrides = getScoreOverrides().filter((o) => o.roundId === roundId);
  // Map lồng nhau: đội → (giám khảo → điểm cộng dồn). Map giống "từ điển" key→value.
  const byTeam = new Map<string, { perJudge: Map<string, { weighted: number; avg: number; count: number }> }>();

  // (3) duyệt từng điểm, đổi về thang 100 và nhân trọng số, cộng dồn theo đội/giám khảo
  for (const s of filtered) {
    const crit = roundCrit.find((c) => c.id === s.criteriaId);
    if (!crit) continue;
    const normalized = (s.score / crit.maxScore) * 100;          // vd 8/10 → 80
    const weighted = normalized * (crit.weight / totalWeight);   // nhân theo tỉ trọng tiêu chí
    if (!byTeam.has(s.teamId)) byTeam.set(s.teamId, { perJudge: new Map() });
    const tm = byTeam.get(s.teamId)!;
    if (!tm.perJudge.has(s.judgeId)) tm.perJudge.set(s.judgeId, { weighted: 0, avg: 0, count: 0 });
    const jm = tm.perJudge.get(s.judgeId)!;
    jm.weighted += weighted;
    jm.avg += normalized;
    jm.count += 1;
  }

  const rows: RankingRow[] = [];
  for (const [teamId, data] of byTeam.entries()) {
    const team = teams.find((t) => t.id === teamId);
    const judgeStats = Array.from(data.perJudge.values()).map((j) => ({
      weighted: j.weighted,
      avg: j.count ? j.avg / j.count : 0,
    }));
    let weighted = judgeStats.length ? judgeStats.reduce((s, j) => s + j.weighted, 0) / judgeStats.length : 0;
    const average = judgeStats.length ? judgeStats.reduce((s, j) => s + j.avg, 0) / judgeStats.length : 0;
    const ov = overrides.find((o) => o.teamId === teamId);
    let overridden = false;
    if (ov) { weighted = ov.overrideScore; overridden = true; }
    rows.push({
      teamId, teamName: team?.name ?? teamId, track: team?.track ?? "—",
      weighted: Number(weighted.toFixed(2)), average: Number(average.toFixed(2)), judgesCount: judgeStats.length,
      overridden,
    });
  }
  // Surface teams that have only an override (no approved scores).
  for (const ov of overrides) {
    if (rows.some((r) => r.teamId === ov.teamId)) continue;
    const team = teams.find((t) => t.id === ov.teamId);
    rows.push({
      teamId: ov.teamId, teamName: team?.name ?? ov.teamId, track: team?.track ?? "—",
      weighted: Number(ov.overrideScore.toFixed(2)), average: 0, judgesCount: 0, overridden: true,
    });
  }
  rows.sort((a, b) => b.weighted - a.weighted);
  return rows;
}

// teamStatus() — tính trạng thái chấm của MỘT giám khảo với MỘT đội ở 1 vòng:
//   vòng đã khoá → LOCKED; chưa chấm ô nào → PENDING; chấm thiếu tiêu chí →
//   IN_PROGRESS; chấm đủ & đã duyệt hết → APPROVED; còn ô chờ duyệt → PENDING_REVIEW.
// Dùng để hiện badge trạng thái ở trang Judge Console.
export function teamStatus(
  scores: JudgeScore[], criteriaCount: number,
  judgeId: string, teamId: string, roundId: string, roundLocked: boolean,
): ScoringStatus {
  if (roundLocked) return "LOCKED";
  const mine = scores.filter((s) => s.judgeId === judgeId && s.teamId === teamId && s.roundId === roundId);
  if (mine.length === 0) return "PENDING";
  if (mine.length < criteriaCount) return "IN_PROGRESS";
  if (mine.every((s) => s.status === "APPROVED")) return "APPROVED";
  if (mine.some((s) => s.status === "PENDING_REVIEW")) return "PENDING_REVIEW";
  return "IN_PROGRESS";
}

// useJudgingStore() — HOOK lấy toàn bộ dữ liệu chấm điểm, tự render lại khi
// có thay đổi (giống useCompetitionStore, chỉ khác tên sự kiện).
export function useJudgingStore() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("judging-store-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("judging-store-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return React.useMemo(() => ({
    rounds: getRounds(),
    teams: getTeams(),
    judges: getJudges(),
    criteria: getCriteria(),
    assignments: getAssignments(),
    scores: getScores(),
    audit: getAudit(),
    overrides: getScoreOverrides(),
    notifications: getNotifications(),
    tick,
  }), [tick]);
}
