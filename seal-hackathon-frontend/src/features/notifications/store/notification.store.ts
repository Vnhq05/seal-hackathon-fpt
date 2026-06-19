import { create } from "zustand";
import type { NotificationStore } from "@/features/notifications/types/notification.types";

export const useNotificationStore = create<NotificationStore>((set) => ({
  activeTab: "all",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
