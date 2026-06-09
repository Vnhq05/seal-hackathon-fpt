"use client";

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

/**
 * Enum phải khớp với Backend:
 * format: Offline / Online / Hybrid
 * status: Draft / Open / Active / Scoring / Closed / Cancelled
 */
export type CompetitionFormat = "Offline" | "Online" | "Hybrid";

export type CompetitionStatus =
    | "Draft"
    | "Open"
    | "Active"
    | "Scoring"
    | "Closed"
    | "Cancelled";

/**
 * Dữ liệu backend trả về từ bảng competitions.
 */
export interface Competition {
    id: number;
    seasonId?: number | null;
    name: string;
    description?: string | null;
    category?: string | null;
    location?: string | null;
    format: CompetitionFormat;
    startDate?: string | null;
    durationDays?: number | null;
    registrationDeadline?: string | null;
    registrationOpen?: string | null;
    registrationClose?: string | null;
    minTeams?: number | null;
    minMembers?: number | null;
    maxMembers?: number | null;
    scoreScale?: number | null;
    status: CompetitionStatus;
    rankingPublished?: boolean;
    createdBy?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

/**
 * Request tạo cuộc thi.
 * Chỉ gửi các field backend đang nhận.
 */
export interface CreateCompetitionRequest {
    seasonId?: number | null;
    name: string;
    description?: string;
    location?: string | null;
    status: CompetitionStatus;
    format: CompetitionFormat;
    startDate?: string | null;
    registrationDeadline?: string | null;
}

/**
 * Request cập nhật cuộc thi.
 * Optional để tránh lỗi set null khi update status/start.
 */
export interface UpdateCompetitionRequest {
    name?: string;
    description?: string;
    location?: string | null;
    status?: CompetitionStatus;
    format?: CompetitionFormat;
    startDate?: string | null;
    registrationDeadline?: string | null;
}

/**
 * GET /api/competitions
 */
export function getCompetitionsApi() {
    return apiGet<Competition[]>("/api/competitions");
}

/**
 * GET /api/competitions/{id}
 */
export function getCompetitionByIdApi(id: number) {
    return apiGet<Competition>(`/api/competitions/${id}`);
}

/** Một vòng thi (bảng rounds). */
export interface Round {
    id: number;
    competitionId: number;
    name: string;
    sequence: number | null;
    startAt?: string | null;
    deadline?: string | null;
    question?: string | null;
    guidelines?: string | null;
    isLocked?: boolean | null;
}

/**
 * GET /api/competitions/{id}/rounds
 * Các vòng của cuộc thi, đã sắp theo sequence tăng dần.
 */
export function getRoundsApi(competitionId: number) {
    return apiGet<Round[]>(`/api/competitions/${competitionId}/rounds`);
}

/** Body tạo/cập nhật một vòng. */
export interface RoundInput {
    name: string;
    sequence?: number | null;
    startAt?: string | null;
    deadline?: string | null;
    question?: string | null;
    guidelines?: string | null;
    isLocked?: boolean | null;
}

/** POST /api/competitions/{id}/rounds — tạo vòng mới (Coordinator/Admin). */
export function createRoundApi(competitionId: number, input: RoundInput) {
    return apiPost<Round>(`/api/competitions/${competitionId}/rounds`, input);
}

/** PUT /api/competitions/{id}/rounds/{roundId} — cập nhật vòng. */
export function updateRoundApi(competitionId: number, roundId: number, input: RoundInput) {
    return apiPut<Round>(`/api/competitions/${competitionId}/rounds/${roundId}`, input);
}

/** DELETE /api/competitions/{id}/rounds/{roundId} — xoá vòng. */
export function deleteRoundApi(competitionId: number, roundId: number) {
    return apiDelete<string>(`/api/competitions/${competitionId}/rounds/${roundId}`);
}

/** Một dòng bảng xếp hạng của 1 vòng. */
export interface RankingRow {
    teamId: number;
    teamName: string;
    finalScore: number | string;
}

/**
 * GET /api/ranking/{roundId}
 * Bảng xếp hạng 1 vòng — đã sort theo finalScore giảm dần (rank = vị trí trong list).
 */
export function getRankingApi(roundId: number) {
    return apiGet<RankingRow[]>(`/api/ranking/${roundId}`);
}

/**
 * POST /api/competitions
 */
export function createCompetitionApi(data: CreateCompetitionRequest) {
    return apiPost<Competition>("/api/competitions", data);
}

/**
 * PUT /api/competitions/{id}
 */
export function updateCompetitionApi(id: number, data: UpdateCompetitionRequest) {
    return apiPut<Competition>(`/api/competitions/${id}`, data);
}

/**
 * DELETE /api/competitions/{id}
 */
export function deleteCompetitionApi(id: number) {
    return apiDelete<void>(`/api/competitions/${id}`);
}

/**
 * HTML datetime-local thường trả: 2026-06-10T08:00
 * Backend LocalDateTime nên nhận: 2026-06-10T08:00:00
 */
export function normalizeDateTime(value?: string | null) {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }

    return value;
}

/**
 * Payload tạo competition an toàn.
 */
export function buildCreateCompetitionPayload(input: {
    seasonId?: number | string | null;
    name: string;
    description?: string;
    location?: string | null;
    status?: CompetitionStatus;
    format?: CompetitionFormat;
    startDate?: string | null;
    registrationDeadline?: string | null;
}): CreateCompetitionRequest {
    return {
        seasonId:
            input.seasonId === undefined ||
            input.seasonId === null ||
            input.seasonId === ""
                ? null
                : Number(input.seasonId),
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        location: input.location?.trim() || null,
        status: input.status ?? "Draft",
        format: input.format ?? "Offline",
        startDate: normalizeDateTime(input.startDate),
        registrationDeadline: normalizeDateTime(input.registrationDeadline),
    };
}

/**
 * Payload update an toàn.
 * Không tự ép field null nếu không cần.
 */
export function buildUpdateCompetitionPayload(input: {
    name?: string;
    description?: string;
    location?: string | null;
    status?: CompetitionStatus;
    format?: CompetitionFormat;
    startDate?: string | null;
    registrationDeadline?: string | null;
}): UpdateCompetitionRequest {
    const payload: UpdateCompetitionRequest = {};

    if (input.name !== undefined) {
        payload.name = input.name.trim();
    }

    if (input.description !== undefined) {
        payload.description = input.description?.trim() ?? "";
    }

    if (input.location !== undefined) {
        payload.location = input.location?.trim() || null;
    }

    if (input.status !== undefined) {
        payload.status = input.status;
    }

    if (input.format !== undefined) {
        payload.format = input.format;
    }

    if (input.startDate !== undefined) {
        payload.startDate = normalizeDateTime(input.startDate);
    }

    if (input.registrationDeadline !== undefined) {
        payload.registrationDeadline = normalizeDateTime(input.registrationDeadline);
    }

    return payload;
}