export type HackathonStatus = "upcoming" | "active" | "ended";
export type SubmissionStatus = "not_submitted" | "submitted" | "reviewed";

export interface DashboardSummary {
  activeHackathons: number;
  totalHackathons: number;
  teamCount: number;
  submissionCount: number;
  unreadNotifications: number;
}

export interface DashboardHackathon {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: HackathonStatus;
  coverImageUrl: string | null;
  teamName: string | null;
  trackName: string | null;
  participantCount: number;
}

export interface DashboardTeam {
  id: string;
  name: string;
  hackathonId: string;
  hackathonName: string;
  memberCount: number;
  maxMembers: number;
  trackName: string | null;
  submissionStatus: SubmissionStatus;
  hackathonStatus: HackathonStatus;
}
