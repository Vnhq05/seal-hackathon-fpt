import { create } from "zustand";
import type { PrizeRank, CompetitionFormat } from "@/lib/api/event.api";

export interface WizardTrack {
  name: string;
  description: string;
  maxTeams: number;
  scoringTemplateId: string | null;
}

export interface WizardRound {
  name: string;
  startDate: string;
  endDate: string;
  judgeUserIds: string[];
  advancementCutoff: number;
  roundWeight: number;
}

export type LecturerRole = "MENTOR" | "JUDGE" | "BOTH";

export interface WizardLecturerAssignment {
  userId: string;
  fullName: string;
  email: string;
  role: LecturerRole;
}

export interface WizardPrize {
  trackId?: string;
  trackIndex?: number;
  rank: PrizeRank;
  value: string;
  quantity: number;
  label?: string;
}

export interface WizardGuest {
  fullName: string;
  title: string;
}

export interface EventWizardData {
  // Step 1
  name: string;
  season: string;
  year: number;
  competitionFormat: CompetitionFormat;
  // Step 2
  description: string;
  location: string;
  format: string;
  tracks: WizardTrack[];
  lecturerAssignments: WizardLecturerAssignment[];
  mentorUserIds: string[];
  judgeUserIds: string[];
  semesterMin: number | null;
  semesterMax: number | null;
  // Step 3
  startDate: string;
  duration: number;
  registrationOpenDate: string;
  registrationDeadline: string;
  rounds: WizardRound[];
  // Step 4
  minTeam: number | null;
  maxTeam: number | null;
  // Step 5
  prizes: WizardPrize[];
  applyPrizesToAllTracks: boolean;
  honoredGuests: WizardGuest[];
  tiebreakerCriteria: string;
  // Step 6
  scoringTemplateId: string | null;
  applyToAllTracks: boolean;
}

interface EventWizardStore {
  step: number;
  data: EventWizardData;
  setStep: (step: number) => void;
  updateData: (partial: Partial<EventWizardData>) => void;
  reset: () => void;
}

const initialData: EventWizardData = {
  name: "",
  season: "",
  year: new Date().getFullYear(),
  competitionFormat: "GENERIC",
  description: "",
  location: "",
  format: "OFFLINE",
  tracks: [],
  lecturerAssignments: [],
  mentorUserIds: [],
  judgeUserIds: [],
  semesterMin: null,
  semesterMax: null,
  startDate: "",
  duration: 1,
  registrationOpenDate: "",
  registrationDeadline: "",
  rounds: [],
  minTeam: null,
  maxTeam: null,
  prizes: [],
  applyPrizesToAllTracks: true,
  honoredGuests: [],
  tiebreakerCriteria: "",
  scoringTemplateId: null,
  applyToAllTracks: true,
};

export const useEventWizardStore = create<EventWizardStore>((set) => ({
  step: 1,
  data: { ...initialData },
  setStep: (step) => set({ step }),
  updateData: (partial) =>
    set((state) => ({ data: { ...state.data, ...partial } })),
  reset: () => set({ step: 1, data: { ...initialData } }),
}));
