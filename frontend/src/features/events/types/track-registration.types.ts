export type TrackStatus = "open" | "full";

export interface TrackMentor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** @deprecated Legacy shape for track-card — use TrackRegistrationTrack */
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

export interface TrackRegistrationTrack {
  id: string;
  name: string;
  description: string;
  topic: string | null;
  maxTeams: number;
}

export interface TrackRegistrationData {
  hackathonId: string;
  hackathonName: string;
  teamId: string;
  teamName: string;
  assignedTrackId: string | null;
  competitionFormat: "GENERIC" | "SEAL_RAG_2026";
  tracks: TrackRegistrationTrack[];
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
