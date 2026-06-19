import { useQuery } from "@tanstack/react-query";
import { fetchAuditLog } from "@/features/staff/services/staff.service";
import type { AuditLogParams } from "@/features/staff/types/staff.types";

export const STAFF_AUDIT_LOG_KEY = "staff-audit-log" as const;

export function useStaffAuditLog(params?: AuditLogParams) {
  return useQuery({
    queryKey: [STAFF_AUDIT_LOG_KEY, params],
    queryFn: () => fetchAuditLog(params),
  });
}
