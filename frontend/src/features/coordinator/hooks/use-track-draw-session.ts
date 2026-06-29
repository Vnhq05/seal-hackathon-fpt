"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import { trackApi } from "@/lib/api/track.api";
import type { OpenTrackDrawSessionRequest } from "@/lib/api/track-assignment.api";

const POLL_INTERVAL_MS = 4000;

export function useTrackDrawSession(eventId: string, enabled: boolean) {
  const qc = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["draw-session", eventId],
    queryFn: () => trackAssignmentApi.getDrawSession(eventId),
    enabled: enabled && !!eventId,
    refetchInterval: (query) =>
      query.state.data?.status === "OPEN" ? POLL_INTERVAL_MS : false,
    retry: false,
  });

  const openMutation = useMutation({
    mutationFn: (body: OpenTrackDrawSessionRequest) =>
      trackAssignmentApi.openDrawSession(eventId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draw-session", eventId] });
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
    },
  });

  const lockMutation = useMutation({
    mutationFn: () => trackAssignmentApi.lockTracks(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draw-session", eventId] });
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
    },
  });

  const assignTopicMutation = useMutation({
    mutationFn: ({ trackId, topic }: { trackId: string; topic: string }) =>
      trackApi.assignTopic(eventId, trackId, { topic }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
    },
  });

  return {
    session: sessionQuery.data,
    isLoadingSession: sessionQuery.isLoading,
    sessionError: sessionQuery.error,
    refetchSession: sessionQuery.refetch,
    openSession: openMutation.mutate,
    openSessionAsync: openMutation.mutateAsync,
    isOpening: openMutation.isPending,
    openError: openMutation.error,
    lockTracks: lockMutation.mutate,
    isLocking: lockMutation.isPending,
    lockResult: lockMutation.data,
    assignTopic: assignTopicMutation.mutate,
    isAssigningTopic: assignTopicMutation.isPending,
  };
}
