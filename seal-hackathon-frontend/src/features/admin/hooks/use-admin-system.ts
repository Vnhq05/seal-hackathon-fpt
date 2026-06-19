import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSystemConfig,
  updateSystemConfig,
  fetchExportPreview,
  downloadExport,
  fetchJudgeVariance,
  fetchCalibrationSessions,
  createCalibrationSession,
  downloadResearchExport,
} from "@/features/admin/services/admin-system.service";
import type { SystemConfig } from "@/features/admin/types/admin.types";
import type {
  ExportRequest,
  CreateCalibrationRequest,
  ResearchExportRequest,
} from "@/features/admin/types/admin-analytics.types";

export const SYSTEM_CONFIG_KEY = "system-config" as const;
export const EXPORT_PREVIEW_KEY = "export-preview" as const;
export const JUDGE_VARIANCE_KEY = "judge-variance" as const;
export const CALIBRATION_SESSIONS_KEY = "calibration-sessions" as const;

export function useSystemConfig() {
  return useQuery({
    queryKey: [SYSTEM_CONFIG_KEY],
    queryFn: fetchSystemConfig,
  });
}

export function useUpdateSystemConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Partial<SystemConfig>) => updateSystemConfig(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SYSTEM_CONFIG_KEY] }),
  });
}

export function useExportPreview(params: ExportRequest | null) {
  return useQuery({
    queryKey: [EXPORT_PREVIEW_KEY, params],
    queryFn: () => fetchExportPreview(params!),
    enabled: !!params?.hackathonId && !!params?.dataType && !!params?.format,
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: (p: ExportRequest) => downloadExport(p),
  });
}

export function useJudgeVariance(hackathonId?: string) {
  return useQuery({
    queryKey: [JUDGE_VARIANCE_KEY, hackathonId],
    queryFn: () => fetchJudgeVariance(hackathonId),
  });
}

export function useCalibrationSessions() {
  return useQuery({
    queryKey: [CALIBRATION_SESSIONS_KEY],
    queryFn: fetchCalibrationSessions,
  });
}

export function useCreateCalibrationSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateCalibrationRequest) => createCalibrationSession(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CALIBRATION_SESSIONS_KEY] }),
  });
}

export function useDownloadResearchExport() {
  return useMutation({
    mutationFn: (p: ResearchExportRequest) => downloadResearchExport(p),
  });
}
