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