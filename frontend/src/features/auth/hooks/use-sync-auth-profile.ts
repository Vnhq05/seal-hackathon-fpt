"use client";

import { useEffect } from "react";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * Keep persisted auth-storage fullName/avatar in sync with /users/me.
 * Fixes stale mojibake names left in localStorage after DB repairs.
 */
export function useSyncAuthProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const { data: profile } = useProfile({ enabled: isAuthenticated });

  useEffect(() => {
    if (!profile || !user) return;
    if (profile.fullName === user.fullName && (profile.avatarUrl ?? null) === (user.avatarUrl ?? null)) {
      return;
    }
    patchUser({
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl ?? user.avatarUrl,
    });
  }, [profile, user, patchUser]);
}
