export interface HackathonDetail {
  id: string;
  name: string;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  format: string;
  minTeamSize: number;
  maxTeamSize: number;
  prizePool: string;
  registrationDeadline: string;
  registrationFee: number | null;
  description: string;
}

export interface HackathonRegistrationRequest {
  hackathonId: string;
  confirmStudent: boolean;
  agreeCodeOfConduct: boolean;
  agreeTeamFormation: boolean;
}

export interface HackathonRegistrationResponse {
  message: string;
  registrationId: string;
}
