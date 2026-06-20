import { create } from "zustand";

interface TeamFilterState {
  search: string;
  track: string;
  openOnly: boolean;
  page: number;
  setSearch: (search: string) => void;
  setTrack: (track: string) => void;
  setOpenOnly: (openOnly: boolean) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useTeamFilterStore = create<TeamFilterState>()((set) => ({
  search: "",
  track: "",
  openOnly: false,
  page: 1,
  setSearch: (search) => set({ search, page: 1 }),
  setTrack: (track) => set({ track, page: 1 }),
  setOpenOnly: (openOnly) => set({ openOnly, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set({ search: "", track: "", openOnly: false, page: 1 }),
}));
