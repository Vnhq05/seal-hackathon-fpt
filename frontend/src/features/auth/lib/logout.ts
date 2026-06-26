import type { QueryClient } from "@tanstack/react-query";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { authApi } from "@/lib/api/auth.api";

export async function performLogout(
  router: AppRouterInstance,
  queryClient: QueryClient,
): Promise<void> {
  const refreshToken = useAuthStore.getState().refreshToken;
  try {
    if (refreshToken) {
      await authApi.logout({ refreshToken });
    }
  } catch {
    // best-effort server revoke
  } finally {
    useAuthStore.getState().clearAuth();
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      document.cookie = "auth-check=; path=/; Max-Age=0; SameSite=Lax";
    }
    queryClient.clear();
    router.push("/login");
  }
}
