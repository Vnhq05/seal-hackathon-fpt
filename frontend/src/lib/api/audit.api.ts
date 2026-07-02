import { api } from "./api-client";
import { apiClient } from "@/lib/axios";
import type { Page, PageParams } from "./types";

// ═══ Types ═══

export interface AuditLogResponse {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string | null;
}

export interface AuditListParams extends PageParams {
  actorId?: string;
  action?: string;
  targetType?: string;
}

export interface AuditRangeParams extends PageParams {
  from: string;
  to: string;
}

export interface AuditExportRequest {
  startDate: string;
  endDate: string;
  format: "CSV" | "JSON";
}

export interface AuditTargetListParams extends PageParams {
  targetType: string;
}

/** Normalize a date-only string to ISO LocalDateTime start-of-day. */
export function toAuditRangeStart(date: string): string {
  return date.includes("T") ? date : `${date}T00:00:00`;
}

/** Normalize a date-only string to ISO LocalDateTime end-of-day. */
export function toAuditRangeEnd(date: string): string {
  return date.includes("T") ? date : `${date}T23:59:59`;
}

function normalizeExportRequest(body: AuditExportRequest): AuditExportRequest {
  return {
    ...body,
    startDate: toAuditRangeStart(body.startDate),
    endDate: toAuditRangeEnd(body.endDate),
  };
}

// ═══ API calls ═══

export const auditApi = {
  list(params?: AuditListParams): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>("/admin/audit", { params });
  },

  listByRange(params: AuditRangeParams): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>("/admin/audit/range", { params });
  },

  listByTarget(
    targetId: string,
    params: AuditTargetListParams,
  ): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>(`/admin/audit/target/${targetId}`, {
      params,
    });
  },

  async export(body: AuditExportRequest): Promise<Blob> {
    const { data } = await apiClient.post(
      "/admin/audit/export",
      normalizeExportRequest(body),
      { responseType: "blob" },
    );
    return data as Blob;
  },
};
