import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { systemConfigApi, auditApi, type SystemConfigRequest, type AuditExportRequest } from "@/lib/api";

export const SYSTEM_CONFIG_KEY = "system-config" as const;
export const EXPORT_PREVIEW_KEY = "export-preview" as const;
export const JUDGE_VARIANCE_KEY = "judge-variance" as const;
export const CALIBRATION_SESSIONS_KEY = "calibration-sessions" as const;

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

/** @deprecated Export preview endpoint does not exist. */
export function useExportPreview() {
  return useQuery({
    queryKey: [EXPORT_PREVIEW_KEY],
    queryFn: () =>
      Promise.resolve({ columns: [] as string[], rows: [] as Record<string, unknown>[], totalRows: 0 }),
    enabled: false,
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: (params: AuditExportRequest) => auditApi.export(params),
  });
}

// ═══════════════════════════════════════════════
//  Analytics — NOT supported by backend yet
// ═══════════════════════════════════════════════

/** @deprecated Judge variance endpoint does not exist. Returns empty data. */
export function useJudgeVariance(_eventId?: string) {
  return useQuery({
    queryKey: [JUDGE_VARIANCE_KEY, _eventId],
    queryFn: () =>
      Promise.resolve({
        entries: [] as never[],
        interRaterReliability: 0,
        averageVariance: 0,
        chartData: [] as never[],
      }),
    enabled: false,
  });
}

/** @deprecated Calibration endpoint does not exist. Returns empty data. */
export function useCalibrationSessions() {
  return useQuery({
    queryKey: [CALIBRATION_SESSIONS_KEY],
    queryFn: () => Promise.resolve([] as never[]),
    enabled: false,
  });
}

/** @deprecated Calibration endpoint does not exist. No-op mutation. */
export function useCreateCalibrationSession() {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      void payload;
      return {} as never;
    },
  });
}

/** @deprecated Research export endpoint does not exist. No-op mutation. */
export function useDownloadResearchExport() {
  return useMutation({
    mutationFn: async (payload: unknown) => {
      void payload;
      return new Blob();
    },
  });
}
