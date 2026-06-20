import { create } from "zustand";

interface LeaderboardState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useLeaderboardStore = create<LeaderboardState>()((set) => ({
  activeTab: "",
  setActiveTab: (activeTab: string) => set({ activeTab }),
}));
