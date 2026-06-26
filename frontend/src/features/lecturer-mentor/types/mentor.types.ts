export interface MentorSummary {
  trackName: string;
  hackathonName: string;
  totalTeams: number;
  submittedCount: number;
  currentRound: string;
  deadline: string | null;
  timeRemaining: string | null;
}

export interface MentorSummaryResponse {
  data: MentorSummary;
}

export type TeamRoundStatus = "submitted" | "pending" | "eliminated" | "not_submitted";

export interface MentorTeamRound {
  roundNumber: number;
  status: TeamRoundStatus;
}

export interface MentorTeam {
  id: string;
  eventId: string;
  name: string;
  initial: string;
  initialBgColor: string;
  displayId: string;
  memberCount: number;
  rounds: MentorTeamRound[];
  lastSubmission: string | null;
  rank: number | null;
  isDisqualified: boolean;
}

export type MentorTeamFilter = "all" | "submitted" | "not_submitted" | "eliminated";

export interface MentorTeamsParams {
  eventId?: string;
  trackId?: string;
  filter?: MentorTeamFilter;
  sortBy?: string;
  search?: string;
}

export interface MentorTeamsResponse {
  data: MentorTeam[];
  trackName: string;
  hackathonName: string;
  submittedCount: number;
  totalTeams: number;
  currentRound: string;
  deadline: string | null;
}

export interface MentorTeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  isLeader: boolean;
}

export interface MentorSubmissionLink {
  label: string;
  url: string;
  type: "github" | "demo" | "document" | "other";
}

export interface MentorRoundSubmission {
  id: string;
  roundNumber: number;
  roundName: string;
  status: "judged" | "needs_judging" | "not_submitted";
  links: MentorSubmissionLink[];
  mentorNotes: string | null;
  aggregateScore: number | null;
  maxScore: number;
}

export interface MentorTeamDetail {
  id: string;
  name: string;
  trackName: string;
  status: "active" | "inactive" | "disqualified";
  description: string;
  memberCount: number;
  maxMembers: number;
  members: MentorTeamMember[];
  rounds: MentorRoundSubmission[];
}

export interface MentorTeamDetailResponse {
  data: MentorTeamDetail;
}

export interface SaveMentorNotesRequest {
  submissionId: string;
  notes: string;
}

export interface SaveMentorNotesResponse {
  message: string;
}

export type MentorActivityType =
  | "submission"
  | "registration"
  | "round_opened"
  | "feedback_completed";

export interface MentorActivity {
  id: string;
  type: MentorActivityType;
  message: string;
  highlightText: string | null;
  timeAgo: string;
}

export interface MentorActivitiesResponse {
  data: MentorActivity[];
}
