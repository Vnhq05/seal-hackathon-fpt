import { create } from "zustand";
import type { NotificationTab } from "@/features/notifications/hooks/use-notifications";

interface NotificationStoreState {
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  activeTab: "all",
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
