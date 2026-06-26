"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { livescoreApi } from "@/lib/api/livescore.api";
import type { LiveScoreBoard, RankingEvent } from "@/lib/api/livescore.api";
import { useStompWebSocket } from "./use-websocket";
import { useEffect, useState, useCallback } from "react";

export function useLiveScoreBoard(eventId: string, trackId?: string, roundId?: string) {
  return useQuery<LiveScoreBoard>({
    queryKey: ["livescore", eventId, trackId, roundId],
    queryFn: () => livescoreApi.getLeaderboard(eventId, { trackId, roundId }),
    enabled: !!eventId,
    refetchInterval: 15000,
  });
}

export function useLiveScoreWebSocket(eventId: string | undefined) {
  const queryClient = useQueryClient();
  const { connected, subscribe } = useStompWebSocket(eventId);
  const [rankingEvents, setRankingEvents] = useState<RankingEvent[]>([]);
  const [finalResults, setFinalResults] = useState(false);

  const clearEvents = useCallback(() => setRankingEvents([]), []);

  useEffect(() => {
    if (!eventId || !connected) return;

    const unsub1 = subscribe(`/topic/events/${eventId}/leaderboard`, () => {
      queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
    });

    const unsub2 = subscribe(`/topic/events/${eventId}/ranking-events`, (data) => {
      const event = data as RankingEvent;
      if (event.type === "FINAL_RESULTS_PUBLISHED") {
        setFinalResults(true);
      }
      if (event.type !== "LEADERBOARD_UPDATED") {
        setRankingEvents((prev) => [event, ...prev].slice(0, 20));
      }
      queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [eventId, connected, subscribe, queryClient]);

  return { connected, rankingEvents, finalResults, clearEvents, setFinalResults };
}

export function useLockScores(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roundId: string) => livescoreApi.lockScores(eventId, roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
    },
  });
}

export function usePublishResults(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roundId: string) => livescoreApi.publishResults(eventId, roundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
    },
  });
}

export function useToggleLeaderboardPublic(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => livescoreApi.setLeaderboardPublic(eventId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["livescore", eventId] });
    },
  });
}
