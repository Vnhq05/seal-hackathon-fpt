export type TrackTeamSubmissionStatus = "submitted" | "draft" | "missing";

export interface TrackTeamEntry {
  id: string;
  name: string;
  initial: string;
  initialBgColor: string;
  displayId: string;
  memberCount: number;
  submissionStatus: TrackTeamSubmissionStatus;
  rank: number | null;
}

export interface TrackRoundTimeline {
  id: string;
  name: string;
  status: "complete" | "active" | "upcoming";
  dateRange: string;
  note: string | null;
}

export interface MentorTrackDetail {
  id: string;
  name: string;
  hackathonName: string;
  description: string;
  maxTeams: number;
  registeredTeams: number;
  currentRound: string;
  submissionCount: number;
  totalTeams: number;
  mentorName: string;
  mentorAvatarUrl: string | null;
  mentorSpecialty: string;
  teams: TrackTeamEntry[];
  totalTeamCount: number;
  rounds: TrackRoundTimeline[];
}

export interface MentorTrackDetailResponse {
  data: MentorTrackDetail;
}
