"use client";
/* ============================================================================
 * competition-store.ts — "kho dữ liệu" về CUỘC THI (giả lập, lưu localStorage).
 * ----------------------------------------------------------------------------
 * KHUÔN MẪU CHUNG của các store trong dự án (judging-store.ts cũng y hệt):
 *   1) Định nghĩa các kiểu dữ liệu (interface) — "hình dạng" của dữ liệu.
 *   2) SEED_*  = dữ liệu mồi tạo sẵn để demo.
 *   3) read()/write()  = đọc/ghi 1 mảng dữ liệu xuống localStorage.
 *      write() còn bắn ra 1 "sự kiện" (CustomEvent) báo "dữ liệu vừa đổi".
 *   4) getXxx() = hàm lấy dữ liệu;  addXxx / updateXxx / deleteXxx = hàm thay đổi dữ liệu.
 *   5) useXStore()  = HOOK cho component: nó nghe sự kiện ở (3) và tự render lại
 *      khi dữ liệu đổi → giao diện luôn khớp với dữ liệu mới nhất.
 *
 * Hiểu khuôn mẫu này 1 lần là đọc được cả 2 store. Khi có backend thật, ta thay
 * read/write bằng gọi API (fetch) — phần component dùng hook gần như không đổi.
 *
 * Phân cấp dữ liệu: Year (năm) → Season (mùa: Spring/Summer) → Competition (cuộc thi).
 * ========================================================================== */
import * as React from "react";

// ----- Các "hình dạng" dữ liệu (chỉ là kiểu TypeScript, không phải dữ liệu thật) -----
export interface Year { id: string; label: string; }                                  // năm, vd "2026"
export interface Season { id: string; yearId: string; label: string; }                // mùa thuộc 1 năm
export interface PrizeTier { id: string; rank: string; amount: string; count: number; } // 1 hạng giải thưởng
export interface ScoringCriterionDef { id: string; name: string; weightPct: number; }   // 1 tiêu chí chấm (trọng số %)
export interface CompetitionRound { id: string; name: string; start: string; question: string; guidelines: string; } // 1 vòng thi
export type CompetitionStatus = "Draft" | "Open" | "Active" | "Scoring" | "Closed" | "Cancelled";
export interface CompetitionFull {
  id: string;
  yearId: string;
  seasonId: string;
  name: string;
  description: string;
  category: string;
  location: string;
  format: "Offline" | "Online" | "Hybrid";
  startDate: string;
  durationDays: 1 | 2 | 3;
  registrationOpen: string;
  registrationClose: string;
  rounds: CompetitionRound[];
  minTeams: number;
  minMembersText: string;
  maxMembersText: string;
  honoredGuests: string[];
  prizes: PrizeTier[];
  rules: string[];
  scoring: ScoringCriterionDef[];
  scoreScale: number;
  status: CompetitionStatus;
  rankingPublished?: boolean;
  createdBy: string;
  createdAt: string;
  backendId?: number; // id thật trên backend nếu cuộc thi này đã được lưu xuống DB
}

export interface MentorMessage {
  id: string; teamId: string; mentorId: string; from: "team" | "mentor"; text: string; at: string;
}
export type MentorInviteStatus = "pending" | "accepted" | "declined" | "cancelled";
export interface MentorInvite {
  id: string;
  teamId: string;
  teamName: string;
  fromUserId: string;
  fromEmail: string;
  toEmail: string;
  message?: string;
  status: MentorInviteStatus;
  createdAt: string;
  respondedAt?: string;
}
export interface PastResult {
  competitionId: string; competitionName: string; seasonId: string;
  teamId: string; teamName: string; finalRank: number;
  status: "Champion" | "Finalist" | "Eliminated" | "Withdrew";
}
export interface SeasonMetrics {
  seasonId: string;
  starsOrganization: number;
  starsMentorship: number;
  starsJudging: number;
  starsPrizes: number;
  npsScore: number;
  responseCount: number;
}

export interface GlobalRule {
  id: string;
  text: string;
  order: number;
  active: boolean;
}
export interface GlobalRulesMeta {
  rules: GlobalRule[];
  lastEditedBy: string;
  lastEditedByName: string;
  lastEditedAt: string;
  version: number;
}

export const DEFAULT_RULES = [
  "All work must be original and produced during the competition period.",
  "Open-source dependencies are allowed; pre-built proprietary code is not.",
  "Each team must submit before the round deadline — late submissions are not accepted.",
  "Plagiarism, harassment, or unsportsmanlike conduct results in immediate disqualification.",
  "The organizing committee's decisions on rule interpretation are final.",
];

const K = {
  years: "seal_years",
  seasons: "seal_seasons",
  competitions: "seal_competitions_v3",
  chat: "seal_mentor_chat",
  past: "seal_past_results",
  invites: "seal_mentor_invites",
  seasonMetrics: "seal_season_metrics",
  globalRules: "seal_global_rules",
};

const SEED_YEARS: Year[] = [
  { id: "y2025", label: "2025" },
  { id: "y2026", label: "2026" },
];
const SEED_SEASONS: Season[] = [
  { id: "s2025-spring", yearId: "y2025", label: "Spring" },
  { id: "s2025-summer", yearId: "y2025", label: "Summer" },
  { id: "s2026-spring", yearId: "y2026", label: "Spring" },
  { id: "s2026-summer", yearId: "y2026", label: "Summer" },
];

const SEED_COMPETITIONS: CompetitionFull[] = [
  {
    id: "c1",
    yearId: "y2026",
    seasonId: "s2026-summer",
    name: "SEAL Summer 2026",
    description: "FPT University's flagship summer hackathon focused on responsible AI and sustainability.",
    category: "AI / Sustainability",
    location: "FPT University Hòa Lạc",
    format: "Offline",
    startDate: "2026-08-02T08:00",
    durationDays: 3,
    registrationOpen: "2026-06-01T00:00",
    registrationClose: "2026-07-25T23:59",
    rounds: [
      { id: "r1", name: "Qualifiers", start: "2026-08-02T08:00", question: "Build a working MVP that addresses a clear pain point.", guidelines: "Submit GitHub repo + 3-min video pitch." },
      { id: "r2", name: "Semi-finals", start: "2026-08-03T08:00", question: "Refine the MVP with measurable impact.", guidelines: "Live demo to judges, 7 minutes Q&A." },
      { id: "r3", name: "Finals", start: "2026-08-04T08:00", question: "Final pitch to the BTC and honored guests.", guidelines: "12-min pitch + 8-min Q&A, full deck." },
    ],
    minTeams: 8,
    minMembersText: "3",
    maxMembersText: "5",
    honoredGuests: ["Prof. Hoang Nam Tien", "Mr. Truong Gia Binh"],
    prizes: [
      { id: "p1", rank: "1st place", amount: "30,000,000 VND", count: 1 },
      { id: "p2", rank: "2nd place", amount: "15,000,000 VND", count: 1 },
      { id: "p3", rank: "3rd place", amount: "8,000,000 VND", count: 1 },
      { id: "p4", rank: "Encouragement Prize", amount: "2,000,000 VND", count: 3 },
    ],
    rules: [],
    scoring: [
      { id: "sc1", name: "Innovation", weightPct: 25 },
      { id: "sc2", name: "Technical Implementation", weightPct: 30 },
      { id: "sc3", name: "UI/UX", weightPct: 15 },
      { id: "sc4", name: "Business Potential", weightPct: 15 },
      { id: "sc5", name: "Presentation", weightPct: 15 },
    ],
    scoreScale: 10,
    status: "Open",
    createdBy: "u4",
    createdAt: "2026-05-15T10:00",
  },
  {
    id: "c0",
    yearId: "y2025",
    seasonId: "s2025-summer",
    name: "SEAL Summer 2025",
    description: "Past edition focused on EdTech and Web3.",
    category: "EdTech / Web3",
    location: "FPT University Hồ Chí Minh",
    format: "Hybrid",
    startDate: "2025-08-02T08:00",
    durationDays: 3,
    registrationOpen: "2025-06-01T00:00",
    registrationClose: "2025-07-25T23:59",
    rounds: [
      { id: "r25-1", name: "Qualifiers", start: "2025-08-02T08:00", question: "Build a 24-hour prototype.", guidelines: "Demo + repo." },
      { id: "r25-2", name: "Finals", start: "2025-08-04T08:00", question: "Final pitch.", guidelines: "10-min pitch." },
    ],
    minTeams: 6,
    minMembersText: "3",
    maxMembersText: "5",
    honoredGuests: ["Mr. Le Hong Viet"],
    prizes: [
      { id: "p1", rank: "1st place", amount: "20,000,000 VND", count: 1 },
      { id: "p2", rank: "2nd place", amount: "10,000,000 VND", count: 1 },
    ],
    rules: [],
    scoring: [
      { id: "sc1", name: "Innovation", weightPct: 30 },
      { id: "sc2", name: "Technical Implementation", weightPct: 40 },
      { id: "sc3", name: "Presentation", weightPct: 30 },
    ],
    scoreScale: 10,
    status: "Closed",
    rankingPublished: true,
    createdBy: "u4",
    createdAt: "2025-05-15T10:00",
  },
  {
    id: "c-prev1", yearId: "y2026", seasonId: "s2026-spring",
    name: "SEAL Spring 2026", description: "Mùa Xuân 2026 — chủ đề Generative AI for Education.",
    category: "AI / EdTech", location: "FPT University Đà Nẵng",
    format: "Offline", startDate: "2026-04-10T08:00", durationDays: 2,
    registrationOpen: "2026-02-15T00:00", registrationClose: "2026-04-05T23:59",
    rounds: [
      { id: "r26s-1", name: "Qualifiers", start: "2026-04-10T08:00", question: "Build an EdTech MVP.", guidelines: "Demo + repo." },
      { id: "r26s-2", name: "Finals", start: "2026-04-11T08:00", question: "Final pitch.", guidelines: "10-min pitch." },
    ],
    minTeams: 8, minMembersText: "3", maxMembersText: "5",
    honoredGuests: ["Ms. Tran Thi Mai Anh"],
    prizes: [
      { id: "p1", rank: "1st place", amount: "25,000,000 VND", count: 1 },
      { id: "p2", rank: "2nd place", amount: "12,000,000 VND", count: 1 },
    ],
    rules: [],
    scoring: [
      { id: "sc1", name: "Innovation", weightPct: 30 },
      { id: "sc2", name: "Technical Implementation", weightPct: 40 },
      { id: "sc3", name: "Presentation", weightPct: 30 },
    ],
    scoreScale: 10, status: "Closed", rankingPublished: true,
    createdBy: "u4", createdAt: "2026-02-01T10:00",
  },
];

const SEED_PAST: PastResult[] = [
  { competitionId: "c0", competitionName: "SEAL Summer 2025", seasonId: "s2025-summer", teamId: "tp1", teamName: "ByteHeroes", finalRank: 1, status: "Champion" },
  { competitionId: "c0", competitionName: "SEAL Summer 2025", seasonId: "s2025-summer", teamId: "tp2", teamName: "AlphaWave", finalRank: 2, status: "Finalist" },
  { competitionId: "c0", competitionName: "SEAL Summer 2025", seasonId: "s2025-summer", teamId: "tp3", teamName: "Logic Labs", finalRank: 5, status: "Eliminated" },
];

const SEED_SEASON_METRICS: SeasonMetrics[] = [
  { seasonId: "s2025-summer", starsOrganization: 4.0, starsMentorship: 3.8, starsJudging: 4.1, starsPrizes: 3.9, npsScore: 35, responseCount: 67 },
  { seasonId: "s2026-spring", starsOrganization: 4.3, starsMentorship: 4.2, starsJudging: 4.3, starsPrizes: 4.0, npsScore: 48, responseCount: 89 },
];

const SEED_GLOBAL_RULES: GlobalRulesMeta = {
  rules: DEFAULT_RULES.map((text, i) => ({ id: `gr${i + 1}`, order: i + 1, active: true, text })),
  lastEditedBy: "system",
  lastEditedByName: "System Seed",
  lastEditedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
};

// read<T>(): đọc dữ liệu kiểu T từ localStorage theo `key`.
//  - Đang ở server (chưa có window) → trả về seed.
//  - localStorage trống → ghi seed vào rồi trả seed (lần chạy đầu tiên).
//  - Có dữ liệu → JSON.parse ra; lỗi hỏng dữ liệu → trả seed cho an toàn.
// <T> là "generic": cùng 1 hàm dùng được cho mọi kiểu (Year[], Season[]...).
function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw) as T; } catch { return seed; }
}
// write<T>(): ghi dữ liệu xuống localStorage RỒI bắn sự kiện "competition-store-changed".
// Hook useCompetitionStore (cuối file) nghe sự kiện này để render lại giao diện.
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("competition-store-changed"));
}

export function getYears() { return read<Year[]>(K.years, SEED_YEARS); }
export function getSeasons() { return read<Season[]>(K.seasons, SEED_SEASONS); }
export function getCompetitions() { return read<CompetitionFull[]>(K.competitions, SEED_COMPETITIONS); }
export function getChat() { return read<MentorMessage[]>(K.chat, []); }
export function getPastResults() { return read<PastResult[]>(K.past, SEED_PAST); }
export function getSeasonMetrics() { return read<SeasonMetrics[]>(K.seasonMetrics, SEED_SEASON_METRICS); }

export function addYear(label: string): Year {
  const years = getYears();
  const y: Year = { id: `y${Date.now()}`, label };
  write(K.years, [...years, y]);
  return y;
}
export function addSeason(yearId: string, label: string): Season {
  const seasons = getSeasons();
  const s: Season = { id: `s${Date.now()}`, yearId, label };
  write(K.seasons, [...seasons, s]);
  return s;
}

// Tạo cuộc thi mới (dùng ở trang Create Competition). `Omit<..., "id"|"createdAt">`
// nghĩa là input cần MỌI trường của CompetitionFull TRỪ id và createdAt (vì 2 cái
// này hàm tự sinh). Nếu publish (không phải Draft) thì tổng trọng số tiêu chí phải = 100%.
export function createCompetition(input: Omit<CompetitionFull, "id" | "createdAt">): CompetitionFull {
  const comps = getCompetitions();
  // Cho phép nhiều cuộc thi chạy song song.
  const totalWeight = input.scoring.reduce((s, c) => s + c.weightPct, 0);
  if (input.status !== "Draft" && totalWeight !== 100) {
    throw new Error(`Scoring criteria weights must total 100% (currently ${totalWeight}%).`);
  }
  const id = `c${Date.now()}`;
  const comp: CompetitionFull = { ...input, id, createdAt: new Date().toISOString() };
  write(K.competitions, [...comps, comp]);
  // Sync rounds into judging-store so /app/rounds shows the new competition's rounds.
  try {
    // lazy import to avoid circular dep at module load
    import("@/lib/judging-store").then(({ addRoundsForCompetition }) => {
      addRoundsForCompetition(
        id,
        input.rounds.map((r) => ({ id: `${id}-${r.id}`, name: r.name, deadline: r.start })),
      );
    });
  } catch {}
  return comp;
}
export function updateCompetition(id: string, patch: Partial<CompetitionFull>) {
  const comps = getCompetitions();
  write(K.competitions, comps.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}
export function deleteCompetition(id: string) {
  write(K.competitions, getCompetitions().filter((c) => c.id !== id));
}

export function addMentorMessage(m: Omit<MentorMessage, "id" | "at">) {
  const chat = getChat();
  const msg: MentorMessage = { ...m, id: `m${Date.now()}`, at: new Date().toISOString() };
  write(K.chat, [...chat, msg]);
  return msg;
}

export function getMentorInvites(): MentorInvite[] {
  return read<MentorInvite[]>(K.invites, []);
}
export function createMentorInvite(input: Omit<MentorInvite, "id" | "createdAt" | "status">): MentorInvite {
  const all = getMentorInvites();
  const dupe = all.find(
    (i) => i.teamId === input.teamId && i.toEmail.toLowerCase() === input.toEmail.toLowerCase() && i.status === "pending",
  );
  if (dupe) throw new Error(`An invite is already pending for ${input.toEmail}.`);
  const invite: MentorInvite = {
    ...input,
    id: `mi${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  write(K.invites, [...all, invite]);
  return invite;
}
export function respondMentorInvite(id: string, status: "accepted" | "declined") {
  const all = getMentorInvites();
  write(
    K.invites,
    all.map((i) => (i.id === id ? { ...i, status, respondedAt: new Date().toISOString() } : i)),
  );
}
export function cancelMentorInvite(id: string) {
  const all = getMentorInvites();
  write(K.invites, all.map((i) => (i.id === id ? { ...i, status: "cancelled" as const, respondedAt: new Date().toISOString() } : i)));
}

export interface TeamMemberInvite {
  token: string;
  teamId: string;
  teamName: string;
  track: string;
  toEmail: string;
  fromEmail: string;
  createdAt: string;
}
const TEAM_INVITES_KEY = "seal_team_member_invites";
export function getTeamMemberInvites(): TeamMemberInvite[] {
  return read<TeamMemberInvite[]>(TEAM_INVITES_KEY, []);
}
export function createTeamMemberInvite(input: Omit<TeamMemberInvite, "token" | "createdAt">): TeamMemberInvite {
  const all = getTeamMemberInvites();
  const dupe = all.find((i) => i.teamId === input.teamId && i.toEmail.toLowerCase() === input.toEmail.toLowerCase());
  if (dupe) return dupe;
  const invite: TeamMemberInvite = {
    ...input,
    token: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  write(TEAM_INVITES_KEY, [...all, invite]);
  return invite;
}
export function getTeamMemberInviteByToken(token: string): TeamMemberInvite | undefined {
  return getTeamMemberInvites().find((i) => i.token === token);
}

export function setRankingPublished(competitionId: string, published: boolean) {
  const comps = getCompetitions();
  write(K.competitions, comps.map((c) => (c.id === competitionId ? { ...c, rankingPublished: published } : c)));
}

export function getGlobalRules(): GlobalRulesMeta {
  return read<GlobalRulesMeta>(K.globalRules, SEED_GLOBAL_RULES);
}
export function setGlobalRules(rules: GlobalRule[], actor: { id: string; name: string }): GlobalRulesMeta {
  const prev = getGlobalRules();
  const next: GlobalRulesMeta = {
    rules: rules.map((r, i) => ({ ...r, order: i + 1 })),
    lastEditedBy: actor.id,
    lastEditedByName: actor.name,
    lastEditedAt: new Date().toISOString(),
    version: prev.version + 1,
  };
  write(K.globalRules, next);
  try {
    import("@/lib/judging-store").then(({ logAudit }) => {
      logAudit({
        userId: actor.id,
        userName: actor.name,
        action: "Updated global competition rules",
        entityType: "Rules",
        entityId: "global-rules",
        oldValue: `v${prev.version} (${prev.rules.length} rules)`,
        newValue: `v${next.version} (${next.rules.length} rules)`,
      });
    });
  } catch {}
  return next;
}

export function useGlobalRules() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("competition-store-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("competition-store-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return React.useMemo(() => getGlobalRules(), [tick]);
}

// useCompetitionStore() — HOOK chính để component lấy mọi dữ liệu cuộc thi.
// Cơ chế "tự cập nhật": giữ 1 số đếm `tick`; mỗi khi nghe sự kiện
// "competition-store-changed" (do write() bắn ra) thì tăng tick → React render
// lại → useMemo chạy lại getYears()/getCompetitions()... lấy dữ liệu mới nhất.
// "storage" là sự kiện trình duyệt bắn khi localStorage đổi từ TAB KHÁC.
export function useCompetitionStore() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("competition-store-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("competition-store-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  // useMemo: chỉ tính lại object này khi `tick` đổi (tránh tính thừa mỗi lần render).
  return React.useMemo(() => ({
    years: getYears(),
    seasons: getSeasons(),
    competitions: getCompetitions(),
    chat: getChat(),
    pastResults: getPastResults(),
    seasonMetrics: getSeasonMetrics(),
    invites: getMentorInvites(),
    tick,
  }), [tick]);
}
