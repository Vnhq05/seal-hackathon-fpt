import { api } from "./api-client";

// ═══ Types ═══

import type { AllowedEmailDomainResponse, AddAllowedEmailDomainRequest } from "@/lib/api/event.api";

export interface SystemConfigResponse {
  id: string;
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules: string | null;
  minTeams: number | null;
  maxTeams: number | null;
  semesterMin: number | null;
  semesterMax: number | null;
  currentSeason: string;
  currentYear: number;
}

export interface SystemConfigRequest {
  minTeamMembers: number;
  maxTeamMembers: number;
  defaultRules?: string;
  minTeams?: number | null;
  maxTeams?: number | null;
  semesterMin?: number | null;
  semesterMax?: number | null;
}

// ═══ API calls ═══

export const systemConfigApi = {
  get(): Promise<SystemConfigResponse> {
    return api.get<SystemConfigResponse>("/admin/system-config");
  },

  getPublic(): Promise<
    Pick<
      SystemConfigResponse,
      | "minTeamMembers"
      | "maxTeamMembers"
      | "defaultRules"
      | "minTeams"
      | "maxTeams"
      | "semesterMin"
      | "semesterMax"
      | "currentSeason"
      | "currentYear"
    >
  > {
    return api.get<
      Pick<
        SystemConfigResponse,
        | "minTeamMembers"
        | "maxTeamMembers"
        | "defaultRules"
        | "minTeams"
        | "maxTeams"
        | "semesterMin"
        | "semesterMax"
        | "currentSeason"
        | "currentYear"
      >
    >("/system-config");
  },

  update(body: SystemConfigRequest): Promise<SystemConfigResponse> {
    return api.put<SystemConfigResponse>("/admin/system-config", body);
  },

  listAllowedEmailDomains(): Promise<AllowedEmailDomainResponse[]> {
    return api.get<AllowedEmailDomainResponse[]>("/admin/system-config/allowed-email-domains");
  },

  addAllowedEmailDomain(body: AddAllowedEmailDomainRequest): Promise<AllowedEmailDomainResponse> {
    return api.post<AllowedEmailDomainResponse>("/admin/system-config/allowed-email-domains", body);
  },

  removeAllowedEmailDomain(domainId: string): Promise<void> {
    return api.delete<void>(`/admin/system-config/allowed-email-domains/${domainId}`);
  },
};
