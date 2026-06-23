import { api } from "./api-client";

// ═══ Types ═══

export interface SystemConfigResponse {
  id: string;
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string | null;
}

export interface SystemConfigRequest {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules?: string;
}

// ═══ API calls ═══

export const systemConfigApi = {
  get(): Promise<SystemConfigResponse> {
    return api.get<SystemConfigResponse>("/admin/system-config");
  },

  update(body: SystemConfigRequest): Promise<SystemConfigResponse> {
    return api.put<SystemConfigResponse>("/admin/system-config", body);
  },
};
