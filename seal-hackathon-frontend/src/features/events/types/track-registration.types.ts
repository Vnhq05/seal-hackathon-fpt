export type TrackStatus = "open" | "full";

export interface TrackMentor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  status: TrackStatus;
  accentColor: string;
  mentor: TrackMentor;
  currentParticipants: number;
  maxParticipants: number;
}

export interface TrackRegistrationData {
  hackathonId: string;
  hackathonName: string;
  teamId: string;
  teamName: string;
  tracks: Track[];
}

export interface TrackRegistrationRequest {
  hackathonId: string;
  teamId: string;
  trackId: string;
}

export interface TrackRegistrationResponse {
  message: string;
  registrationId: string;
}
