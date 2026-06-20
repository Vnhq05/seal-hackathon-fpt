export type HackathonStatus = "upcoming" | "ongoing" | "ended" | "open";

export type TimelineStepStatus = "completed" | "current" | "upcoming";

export interface HackathonMentor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface HackathonTrack {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  iconBgColor: string;
  teamCount: number;
  mentors: HackathonMentor[];
  isUserTrack: boolean;
}

export interface TimelineStep {
  id: string;
  title: string;
  datetime: string;
  description: string;
  status: TimelineStepStatus;
  progressPercent: number | null;
  timeRemaining: string | null;
}

export interface JudgingCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface CompetitionRound {
  id: string;
  title: string;
  description: string;
}

export interface KeyDate {
  id: string;
  label: string;
  sublabel: string;
  dateText: string;
  timeText: string;
  isCurrent: boolean;
}

export interface HackathonTeamInfo {
  id: string;
  name: string;
  initial: string;
  memberCount: number;
  initialBgColor: string;
  initialTextColor: string;
}

export interface HackathonRegistration {
  isRegistered: boolean;
  statusTitle: string;
  statusDescription: string;
  team: HackathonTeamInfo | null;
}

export interface HackathonDetail {
  id: string;
  name: string;
  description: string;
  longDescription: string[];
  bannerUrl: string | null;
  status: HackathonStatus;
  registration: HackathonRegistration;
  tracks: HackathonTrack[];
  timeline: TimelineStep[];
  judgingCriteria: JudgingCriterion[];
  rounds: CompetitionRound[];
  keyDates: KeyDate[];
}

export interface HackathonDetailResponse {
  data: HackathonDetail;
}
