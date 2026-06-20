import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api/audit.api";
import type { AuditLogParams, AuditLogEntry, PaginatedResponse } from "@/features/staff/types/staff.types";

export const STAFF_AUDIT_LOG_KEY = "staff-audit-log" as const;

/**
 * Fetches audit log using auditApi.list().
 * Maps from lib/api Page<AuditLogResponse> to the component's PaginatedResponse<AuditLogEntry>.
 */
export function useStaffAuditLog(params?: AuditLogParams) {
  return useQuery<PaginatedResponse<AuditLogEntry>>({
    queryKey: [STAFF_AUDIT_LOG_KEY, params],
    queryFn: async (): Promise<PaginatedResponse<AuditLogEntry>> => {
      const page = await auditApi.list({
        page: params?.page ? params.page - 1 : 0,
        size: params?.pageSize ?? 20,
        action: params?.action,
      });

      const items = page.content.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId,
        action: entry.action,
        targetId: entry.targetId,
        targetType: entry.targetType,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        timestamp: entry.timestamp,
        ipAddress: entry.ipAddress,
      })) as unknown as AuditLogEntry[];

      return {
        data: items,
        total: page.totalElements,
        page: page.number + 1,
        pageSize: page.size,
        totalPages: page.totalPages,
      } as unknown as PaginatedResponse<AuditLogEntry>;
    },
  });
}
