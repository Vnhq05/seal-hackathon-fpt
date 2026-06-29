"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { finalistApi } from "@/lib/api/finalist.api";

export const FINALISTS_KEY = "finalists" as const;
export const FINALISTS_CONTESTED_KEY = "finalists-contested" as const;

export function useFinalists(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [FINALISTS_KEY, eventId],
    queryFn: () => finalistApi.list(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useContestedFinalistSlots(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [FINALISTS_CONTESTED_KEY, eventId],
    queryFn: () => finalistApi.listContested(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useSelectFinalists(eventId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finalistApi.select(eventId!),
    onSuccess: () => {
      if (!eventId) return;
      queryClient.invalidateQueries({ queryKey: [FINALISTS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [FINALISTS_CONTESTED_KEY, eventId] });
    },
  });
}
