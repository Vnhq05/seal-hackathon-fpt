import { api } from "./api-client";

// ═══ Types ═══

export interface SystemConfigResponse {
  id: string;
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string | null;
  minTeams: number | null;
  maxTeams: number | null;
}

export interface SystemConfigRequest {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules?: string;
  minTeams?: number | null;
  maxTeams?: number | null;
}

// ═══ API calls ═══

export const systemConfigApi = {
  get(): Promise<SystemConfigResponse> {
    return api.get<SystemConfigResponse>("/admin/system-config");
  },

  getPublic(): Promise<Pick<SystemConfigResponse, "minTeamMembers" | "maxTeamMembers">> {
    return api.get<Pick<SystemConfigResponse, "minTeamMembers" | "maxTeamMembers">>("/system-config");
  },

  update(body: SystemConfigRequest): Promise<SystemConfigResponse> {
    return api.put<SystemConfigResponse>("/admin/system-config", body);
  },
};
