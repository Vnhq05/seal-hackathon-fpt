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
