export type HackathonListStatus = "open" | "upcoming" | "ongoing" | "ended";
export type HackathonFilterTab = "all" | HackathonListStatus;

export interface HackathonRound {
  current: number;
  total: number;
  progressPercent: number;
}

export interface HackathonListItem {
  id: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  status: HackathonListStatus;
  startDate: string;
  endDate: string;
  participantCount: number | null;
  category: string;
  currentRound: HackathonRound | null;
  registrationClosesAt: string | null;
  winnersCount: number | null;
}

export interface HackathonListParams {
  status?: HackathonFilterTab;
  search?: string;
}

export interface HackathonListResponse {
  data: HackathonListItem[];
  total: number;
}
