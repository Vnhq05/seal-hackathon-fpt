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

// ═══ API calls ═══

export const auditApi = {
  list(params?: AuditListParams): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>("/admin/audit", { params });
  },

  listByRange(params: AuditRangeParams): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>("/admin/audit/range", { params });
  },

  listByTarget(targetId: string, targetType: string, params?: PageParams): Promise<Page<AuditLogResponse>> {
    return api.get<Page<AuditLogResponse>>(`/admin/audit/target/${targetId}`, {
      params: { targetType, ...params },
    });
  },

  async export(body: AuditExportRequest): Promise<Blob> {
    const { data } = await apiClient.post("/admin/audit/export", body, {
      responseType: "blob",
    });
    return data as Blob;
  },
};
