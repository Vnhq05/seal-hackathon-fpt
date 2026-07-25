import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { AuthState } from "@/features/auth/types/auth.types";
import type { UserInfo } from "@/lib/api/auth.api";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function createAuthStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(name);
    },
    setItem: (name, value) => {
      localStorage.setItem(name, value);
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = "auth-check=; path=/; max-age=0; SameSite=Lax";
    },
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user: UserInfo, accessToken: string) =>
        set({ user, accessToken, isAuthenticated: true }),
      patchUser: (patch) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...patch } } : state,
        ),
      setRefreshToken: (token: string) => set({ refreshToken: token }),
      clearAuth: () => {
        if (typeof window !== "undefined") {
          document.cookie = "auth-check=; path=/; max-age=0; SameSite=Lax";
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => createAuthStorage()),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
