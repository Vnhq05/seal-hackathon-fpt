"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { UserType } from "@/lib/api/types";

const USER_TYPE_HOME: Record<UserType, string> = {
  SYSTEM_ADMIN: "/admin",
  EVENT_COORDINATOR: "/coordinator",
  LECTURER: "/lecturer",
  FPT_STUDENT: "/student",
  EXTERNAL_STUDENT: "/student",
};

interface AuthGuardProps {
  allowedRoles: UserType[];
  children: ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => setReady(true);

    if (useAuthStore.persist.hasHydrated()) {
      finish();
    } else {
      return useAuthStore.persist.onFinishHydration(finish);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.userType)) {
      router.replace(USER_TYPE_HOME[user.userType] ?? "/login");
      return;
    }
  }, [ready, isAuthenticated, user, allowedRoles, router]);

  const authorized =
    ready && isAuthenticated && user != null && allowedRoles.includes(user.userType);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-seal-bg">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-seal-purple border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <>{children}</>;
}
