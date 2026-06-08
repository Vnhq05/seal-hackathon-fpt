"use client";

import * as React from "react";
import {
  getCompetitionsApi,
  createCompetitionApi,
  updateCompetitionApi,
  deleteCompetitionApi,
  buildCreateCompetitionPayload,
  type Competition as ApiCompetition,
  type CompetitionStatus,
  type CompetitionFormat,
} from "@/lib/competition";

/* ============================================================================
 * competition-store.ts
 * ----------------------------------------------------------------------------
 * Bản đã chỉnh:
 * - competitions lấy từ API thật: GET /api/competitions
 * - vẫn giữ years/seasons/metrics/invites dạng localStorage để UI cũ không crash
 * - giữ interface CompetitionFull để các page cũ vẫn dùng được
 * ========================================================================== */

export interface Year {
  id: string;
  label: string;
}

export interface Season {
  id: string;
  yearId: string;
  label: string;
}

export interface PrizeTier {
  id: string;
  rank: string;
  amount: string;
  count: number;
}

export interface ScoringCriterionDef {
  id: string;
  name: string;
  weightPct: number;
}

export interface CompetitionRound {
  id: string;
  name: string;
  start: string;
  question: string;
  guidelines: string;
}

export interface CompetitionFull {
  id: string;
  yearId: string;
  seasonId: string;
  name: string;
  description: string;
  category: string;
  location: string;
  format: CompetitionFormat;
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
}

export interface MentorMessage {
  id: string;
  teamId: string;
  mentorId: string;
  from: "team" | "mentor";
  text: string;
  at: string;
}

export type MentorInviteStatus =
    | "pending"
    | "accepted"
    | "declined"
    | "cancelled";

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
  competitionId: string;
  competitionName: string;
  seasonId: string;
  teamId: string;
  teamName: string;
  finalRank: number;
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

export interface TeamMemberInvite {
  token: string;
  teamId: string;
  teamName: string;
  track: string;
  toEmail: string;
  fromEmail: string;
  createdAt: string;
}

const K = {
  years: "seal_years",
  seasons: "seal_seasons",
  chat: "seal_mentor_chat",
  past: "seal_past_results",
  invites: "seal_mentor_invites",
  seasonMetrics: "seal_season_metrics",
  globalRules: "seal_global_rules",
  teamInvites: "seal_team_member_invites",
};

/**
 * Cho khớp DB hiện tại của bạn: season_id = 1.
 * Nếu sau này backend có API seasons thật thì thay tiếp.
 */
const SEED_YEARS: Year[] = [
  { id: "2025", label: "2025" },
  { id: "2026", label: "2026" },
];

const SEED_SEASONS: Season[] = [
  { id: "1", yearId: "2026", label: "Summer" },
  { id: "2", yearId: "2026", label: "Spring" },
  { id: "3", yearId: "2025", label: "Summer" },
  { id: "4", yearId: "2025", label: "Spring" },
];

export const DEFAULT_RULES = [
  "All work must be original and produced during the competition period.",
  "Open-source dependencies are allowed; pre-built proprietary code is not.",
  "Each team must submit before the round deadline — late submissions are not accepted.",
  "Plagiarism, harassment, or unsportsmanlike conduct results in immediate disqualification.",
  "The organizing committee's decisions on rule interpretation are final.",
];

const SEED_PAST: PastResult[] = [];

const SEED_SEASON_METRICS: SeasonMetrics[] = [
  {
    seasonId: "1",
    starsOrganization: 4.0,
    starsMentorship: 3.8,
    starsJudging: 4.1,
    starsPrizes: 3.9,
    npsScore: 35,
    responseCount: 67,
  },
  {
    seasonId: "2",
    starsOrganization: 4.3,
    starsMentorship: 4.2,
    starsJudging: 4.3,
    starsPrizes: 4.0,
    npsScore: 48,
    responseCount: 89,
  },
];

const SEED_GLOBAL_RULES: GlobalRulesMeta = {
  rules: DEFAULT_RULES.map((text, i) => ({
    id: `gr${i + 1}`,
    order: i + 1,
    active: true,
    text,
  })),
  lastEditedBy: "system",
  lastEditedByName: "System Seed",
  lastEditedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
};

function read<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;

  const raw = localStorage.getItem(key);

  if (!raw) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("competition-store-changed"));
}

/**
 * Map dữ liệu backend thật sang CompetitionFull để UI cũ không cần sửa nhiều.
 */
function mapApiCompetitionToFull(c: ApiCompetition): CompetitionFull {
  const seasonId = c.seasonId ? String(c.seasonId) : "1";
  const season = SEED_SEASONS.find((s) => s.id === seasonId);
  const yearId = season?.yearId ?? "2026";

  return {
    id: String(c.id),
    yearId,
    seasonId,

    name: c.name,
    description: c.description ?? "",
    category: c.category ?? "",
    location: c.location ?? "",

    format: c.format ?? "Offline",
    startDate: c.startDate ?? "",
    durationDays: normalizeDurationDays(c.durationDays),

    registrationOpen: c.registrationOpen ?? "",
    registrationClose:
        c.registrationClose ??
        c.registrationDeadline ??
        "",

    rounds: [],

    minTeams: c.minTeams ?? 0,
    minMembersText: String(c.minMembers ?? 3),
    maxMembersText: String(c.maxMembers ?? 5),

    honoredGuests: [],
    prizes: [],
    rules: [],
    scoring: [],
    scoreScale: c.scoreScale ?? 10,

    status: c.status ?? "Draft",
    rankingPublished: c.rankingPublished ?? false,

    createdBy: String(c.createdBy ?? ""),
    createdAt: c.createdAt ?? "",
  };
}

function normalizeDurationDays(value?: number | null): 1 | 2 | 3 {
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 1;
}

/**
 * Static/local data vẫn giữ để các page khác không vỡ.
 */
export function getYears() {
  return read<Year[]>(K.years, SEED_YEARS);
}

export function getSeasons() {
  return read<Season[]>(K.seasons, SEED_SEASONS);
}

/**
 * Lưu ý:
 * getCompetitions() là hàm sync nên không gọi API được.
 * Các page cần data thật nên dùng useCompetitionStore().
 */
export function getCompetitions(): CompetitionFull[] {
  return [];
}

export function getChat() {
  return read<MentorMessage[]>(K.chat, []);
}

export function getPastResults() {
  return read<PastResult[]>(K.past, SEED_PAST);
}

export function getSeasonMetrics() {
  return read<SeasonMetrics[]>(K.seasonMetrics, SEED_SEASON_METRICS);
}

export function addYear(label: string): Year {
  const years = getYears();
  const y: Year = {
    id: `${Date.now()}`,
    label,
  };

  write(K.years, [...years, y]);
  return y;
}

export function addSeason(yearId: string, label: string): Season {
  const seasons = getSeasons();
  const s: Season = {
    id: `${Date.now()}`,
    yearId,
    label,
  };

  write(K.seasons, [...seasons, s]);
  return s;
}

/**
 * Tạo competition qua API thật.
 */
export async function createCompetition(
    input: Omit<CompetitionFull, "id" | "createdAt">
): Promise<CompetitionFull> {
  const created = await createCompetitionApi(
      buildCreateCompetitionPayload({
        seasonId: input.seasonId,
        name: input.name,
        description: input.description,
        status: input.status,
        format: input.format,
        startDate: input.startDate,
        registrationDeadline: input.registrationClose,
      })
  );

  window.dispatchEvent(new CustomEvent("competition-store-changed"));

  return mapApiCompetitionToFull(created);
}

/**
 * Update competition qua API thật.
 */
export async function updateCompetition(
    id: string,
    patch: Partial<CompetitionFull>
): Promise<CompetitionFull> {
  const updated = await updateCompetitionApi(Number(id), {
    name: patch.name,
    description: patch.description,
    status: patch.status,
    format: patch.format,
    startDate: patch.startDate,
    registrationDeadline: patch.registrationClose,
  });

  window.dispatchEvent(new CustomEvent("competition-store-changed"));

  return mapApiCompetitionToFull(updated);
}

/**
 * Delete competition qua API thật.
 */
export async function deleteCompetition(id: string): Promise<void> {
  await deleteCompetitionApi(Number(id));
  window.dispatchEvent(new CustomEvent("competition-store-changed"));
}

export function addMentorMessage(m: Omit<MentorMessage, "id" | "at">) {
  const chat = getChat();
  const msg: MentorMessage = {
    ...m,
    id: `m${Date.now()}`,
    at: new Date().toISOString(),
  };

  write(K.chat, [...chat, msg]);
  return msg;
}

export function getMentorInvites(): MentorInvite[] {
  return read<MentorInvite[]>(K.invites, []);
}

export function createMentorInvite(
    input: Omit<MentorInvite, "id" | "createdAt" | "status">
): MentorInvite {
  const all = getMentorInvites();

  const dupe = all.find(
      (i) =>
          i.teamId === input.teamId &&
          i.toEmail.toLowerCase() === input.toEmail.toLowerCase() &&
          i.status === "pending"
  );

  if (dupe) {
    throw new Error(`An invite is already pending for ${input.toEmail}.`);
  }

  const invite: MentorInvite = {
    ...input,
    id: `mi${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  write(K.invites, [...all, invite]);
  return invite;
}

export function respondMentorInvite(
    id: string,
    status: "accepted" | "declined"
) {
  const all = getMentorInvites();

  write(
      K.invites,
      all.map((i) =>
          i.id === id
              ? {
                ...i,
                status,
                respondedAt: new Date().toISOString(),
              }
              : i
      )
  );
}

export function cancelMentorInvite(id: string) {
  const all = getMentorInvites();

  write(
      K.invites,
      all.map((i) =>
          i.id === id
              ? {
                ...i,
                status: "cancelled" as const,
                respondedAt: new Date().toISOString(),
              }
              : i
      )
  );
}

export function getTeamMemberInvites(): TeamMemberInvite[] {
  return read<TeamMemberInvite[]>(K.teamInvites, []);
}

export function createTeamMemberInvite(
    input: Omit<TeamMemberInvite, "token" | "createdAt">
): TeamMemberInvite {
  const all = getTeamMemberInvites();

  const dupe = all.find(
      (i) =>
          i.teamId === input.teamId &&
          i.toEmail.toLowerCase() === input.toEmail.toLowerCase()
  );

  if (dupe) return dupe;

  const invite: TeamMemberInvite = {
    ...input,
    token: `inv_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  write(K.teamInvites, [...all, invite]);
  return invite;
}

export function getTeamMemberInviteByToken(
    token: string
): TeamMemberInvite | undefined {
  return getTeamMemberInvites().find((i) => i.token === token);
}

export function setRankingPublished(
    competitionId: string,
    published: boolean
) {
  updateCompetition(competitionId, {
    rankingPublished: published,
  }).catch((error) => {
    console.error("Failed to update rankingPublished:", error);
  });
}

export function getGlobalRules(): GlobalRulesMeta {
  return read<GlobalRulesMeta>(K.globalRules, SEED_GLOBAL_RULES);
}

export function setGlobalRules(
    rules: GlobalRule[],
    actor: { id: string; name: string }
): GlobalRulesMeta {
  const prev = getGlobalRules();

  const next: GlobalRulesMeta = {
    rules: rules.map((r, i) => ({
      ...r,
      order: i + 1,
    })),
    lastEditedBy: actor.id,
    lastEditedByName: actor.name,
    lastEditedAt: new Date().toISOString(),
    version: prev.version + 1,
  };

  write(K.globalRules, next);
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

/**
 * Hook chính.
 * competitions lấy từ backend thật.
 */
export function useCompetitionStore() {
  const [tick, setTick] = React.useState(0);
  const [competitions, setCompetitions] = React.useState<CompetitionFull[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = React.useState(true);

  React.useEffect(() => {
    async function loadCompetitions() {
      try {
        setLoadingCompetitions(true);

        const data = await getCompetitionsApi();
        setCompetitions(data.map(mapApiCompetitionToFull));
      } catch (error) {
        console.error("Failed to load competitions from API:", error);
        setCompetitions([]);
      } finally {
        setLoadingCompetitions(false);
      }
    }

    loadCompetitions();
  }, [tick]);

  React.useEffect(() => {
    const h = () => setTick((t) => t + 1);

    window.addEventListener("competition-store-changed", h);
    window.addEventListener("storage", h);

    return () => {
      window.removeEventListener("competition-store-changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  return React.useMemo(
      () => ({
        years: getYears(),
        seasons: getSeasons(),
        competitions,
        chat: getChat(),
        pastResults: getPastResults(),
        seasonMetrics: getSeasonMetrics(),
        invites: getMentorInvites(),
        loadingCompetitions,
        tick,
      }),
      [competitions, loadingCompetitions, tick]
  );
}