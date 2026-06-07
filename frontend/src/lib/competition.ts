"use client";

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

/**
 * Enum phải khớp với DB + Backend hiện tại:
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
 * Các field optional vì hiện tại Entity/DTO backend có thể chưa map đủ hết.
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
 * Chỉ gửi các field mà API backend hiện tại đang nhận.
 */
export interface CreateCompetitionRequest {
    seasonId?: number | null;
    name: string;
    description?: string;
    status: CompetitionStatus;
    format: CompetitionFormat;
    startDate?: string | null;
}

/**
 * Request cập nhật cuộc thi.
 */
export interface UpdateCompetitionRequest {
    name?: string;
    description?: string;
    status?: CompetitionStatus;
    format?: CompetitionFormat;
    startDate?: string | null;
}

/**
 * GET /api/competitions
 * Lấy danh sách cuộc thi từ backend thật.
 */
export function getCompetitionsApi() {
    return apiGet<Competition[]>("/api/competitions");
}

/**
 * GET /api/competitions/{id}
 * Lấy chi tiết 1 cuộc thi.
 */
export function getCompetitionByIdApi(id: number) {
    return apiGet<Competition>(`/api/competitions/${id}`);
}

/**
 * POST /api/competitions
 * Tạo cuộc thi mới.
 */
export function createCompetitionApi(data: CreateCompetitionRequest) {
    return apiPost<Competition>("/api/competitions", data);
}

/**
 * PUT /api/competitions/{id}
 * Cập nhật cuộc thi.
 */
export function updateCompetitionApi(id: number, data: UpdateCompetitionRequest) {
    return apiPut<Competition>(`/api/competitions/${id}`, data);
}

/**
 * DELETE /api/competitions/{id}
 * Xóa cuộc thi.
 */
export function deleteCompetitionApi(id: number) {
    return apiDelete<void>(`/api/competitions/${id}`);
}

/**
 * Helper chuyển ngày từ input datetime-local sang LocalDateTime backend.
 * HTML input thường trả: 2026-06-10T08:00
 * Backend LocalDateTime nhận tốt hơn nếu có giây: 2026-06-10T08:00:00
 */
export function normalizeDateTime(value?: string | null) {
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }

    return value;
}

/**
 * Helper tạo payload an toàn trước khi gửi API.
 */
export function buildCreateCompetitionPayload(input: {
    seasonId?: number | string | null;
    name: string;
    description?: string;
    status?: CompetitionStatus;
    format?: CompetitionFormat;
    startDate?: string | null;
}): CreateCompetitionRequest {
    return {
        seasonId:
            input.seasonId === undefined || input.seasonId === null || input.seasonId === ""
                ? null
                : Number(input.seasonId),
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        status: input.status ?? "Draft",
        format: input.format ?? "Offline",
        startDate: normalizeDateTime(input.startDate),
    };
}