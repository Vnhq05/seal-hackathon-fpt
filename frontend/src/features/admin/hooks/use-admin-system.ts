import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemConfigApi, auditApi, type SystemConfigRequest, type AuditExportRequest } from "@/lib/api";

export const SYSTEM_CONFIG_KEY = "system-config" as const;

// ═══════════════════════════════════════════════
//  System config (real API)
// ═══════════════════════════════════════════════

export function useSystemConfig() {
  return useQuery({
    queryKey: [SYSTEM_CONFIG_KEY],
    queryFn: () => systemConfigApi.get(),
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemConfigRequest) => systemConfigApi.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SYSTEM_CONFIG_KEY] }),
  });
}

// ═══════════════════════════════════════════════
//  Export — uses auditApi.export()
// ═══════════════════════════════════════════════

export function useDownloadExport() {
  return useMutation({
    mutationFn: (params: AuditExportRequest) => auditApi.export(params),
  });
}
