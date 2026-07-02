import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { adminUserApi } from "@/lib/api";

export interface AuditActorInfo {
  fullName: string;
  email: string;
}

const ACTOR_STALE_TIME = 5 * 60 * 1000;

export function useAuditActorMap(actorIds: string[]) {
  const uniqueIds = useMemo(
    () => [...new Set(actorIds.filter(Boolean))],
    [actorIds],
  );

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["admin-user", id],
      queryFn: () => adminUserApi.getUserById(id),
      staleTime: ACTOR_STALE_TIME,
      retry: false,
    })),
  });

  const actorMap = useMemo(() => {
    const map = new Map<string, AuditActorInfo>();
    uniqueIds.forEach((id, index) => {
      const result = queries[index]?.data;
      if (result) {
        map.set(id, { fullName: result.fullName, email: result.email });
      }
    });
    return map;
  }, [uniqueIds, queries]);

  return actorMap;
}

export function formatActorLabel(
  actorId: string,
  actorMap: Map<string, AuditActorInfo>,
): string {
  const actor = actorMap.get(actorId);
  if (actor) {
    return `${actor.fullName} (${actor.email})`;
  }
  if (actorId.length > 12) {
    return `${actorId.slice(0, 8)}…`;
  }
  return actorId;
}
