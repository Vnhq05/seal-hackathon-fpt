import { useQuery } from "@tanstack/react-query";
import { auditApi, toAuditRangeEnd, toAuditRangeStart } from "@/lib/api";

export const ADMIN_AUDIT_LOGS_KEY = "admin-audit-logs" as const;

export interface AuditLogsFilterParams {
  actorId?: string;
  action?: string;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

export function useAuditLogs(params: AuditLogsFilterParams) {
  const {
    actorId,
    action,
    targetType,
    fromDate,
    toDate,
    page = 0,
    size = 50,
  } = params;

  const hasDateRange = Boolean(fromDate && toDate);

  return useQuery({
    queryKey: [ADMIN_AUDIT_LOGS_KEY, params],
    queryFn: async () => {
      const pageable = { page, size, sort: "timestamp,desc" as const };

      if (hasDateRange) {
        return auditApi.listByRange({
          from: toAuditRangeStart(fromDate!),
          to: toAuditRangeEnd(toDate!),
          ...pageable,
        });
      }

      return auditApi.list({
        actorId: actorId || undefined,
        action: action || undefined,
        targetType: targetType || undefined,
        ...pageable,
      });
    },
  });
}
