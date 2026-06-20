import { useQuery, useMutation } from "@tanstack/react-query";
import { auditApi, type AuditExportRequest } from "@/lib/api";

export const SYSTEM_CONFIG_KEY = "system-config" as const;
export const EXPORT_PREVIEW_KEY = "export-preview" as const;
export const JUDGE_VARIANCE_KEY = "judge-variance" as const;
export const CALIBRATION_SESSIONS_KEY = "calibration-sessions" as const;

/* ═══════════════════════════════════════════════
 *  System config — NOT supported by backend
 * ═══════════════════════════════════════════════ */

// TODO: /admin/system-config endpoint does not exist in the backend.

/** @deprecated System config endpoint does not exist. Returns placeholder data. */
export function useSystemConfig() {
  return useQuery({
    queryKey: [SYSTEM_CONFIG_KEY],
    queryFn: () =>
      Promise.resolve({
        platformName: "SEAL Hackathon",
        registrationOpen: true,
        maxTeamSize: 5,
        emailTemplateWelcome: "",
        emailTemplateSubmission: "",
        featureFlagLeaderboard: false,
        featureFlagMentorPortal: false,
        featureFlagJudgePortal: false,
      }),
  });
}

/** @deprecated System config endpoint does not exist. No-op mutation. */
export function useUpdateSystemConfig() {
  return useMutation({
    mutationFn: async (_payload: Record<string, unknown>) => {
      // TODO: No backend endpoint for system config
      console.warn("[useUpdateSystemConfig] No backend endpoint; ignoring update.");
      return {};
    },
  });
}

/* ═══════════════════════════════════════════════
 *  Export — uses auditApi.export()
 * ═══════════════════════════════════════════════ */

// TODO: The old /admin/export/preview endpoint does not exist.
// Export is now handled by auditApi.export() which returns a Blob.

/** @deprecated Export preview endpoint does not exist. */
export function useExportPreview() {
  return useQuery({
    queryKey: [EXPORT_PREVIEW_KEY],
    queryFn: () =>
      Promise.resolve({ columns: [] as string[], rows: [] as Record<string, unknown>[], totalRows: 0 }),
    enabled: false,
  });
}

/** Download an audit-log export as a Blob. */
export function useDownloadExport() {
  return useMutation({
    mutationFn: (params: AuditExportRequest) => auditApi.export(params),
  });
}

/* ═══════════════════════════════════════════════
 *  Analytics — NOT supported by backend
 * ═══════════════════════════════════════════════ */

// TODO: /admin/analytics/* endpoints do not exist in the backend.

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
    mutationFn: async (_payload: unknown) => {
      // TODO: No backend endpoint for calibration sessions
      console.warn("[useCreateCalibrationSession] No backend endpoint.");
      return {} as never;
    },
  });
}

/** @deprecated Research export endpoint does not exist. No-op mutation. */
export function useDownloadResearchExport() {
  return useMutation({
    mutationFn: async (_payload: unknown) => {
      // TODO: No backend endpoint for research exports
      console.warn("[useDownloadResearchExport] No backend endpoint.");
      return new Blob();
    },
  });
}
