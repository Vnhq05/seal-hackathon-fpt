"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { awardApi } from "@/lib/api/award.api";

export const AWARDS_KEY = "awards" as const;
export const AWARDS_PARTICIPATION_KEY = "awards-participation" as const;
export const AWARDS_PARTICIPATION_SUMMARY_KEY = "awards-participation-summary" as const;
export const MY_PARTICIPATION_CERT_KEY = "my-participation-certificate" as const;

export function useTeamAwards(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [AWARDS_KEY, eventId],
    queryFn: () => awardApi.list(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function usePublicAwards(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [AWARDS_KEY, "public", eventId],
    queryFn: () => awardApi.listPublic(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useParticipationCertificates(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [AWARDS_PARTICIPATION_KEY, eventId],
    queryFn: () => awardApi.listParticipation(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useParticipationSummary(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [AWARDS_PARTICIPATION_SUMMARY_KEY, eventId],
    queryFn: () => awardApi.listParticipationPublic(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useMyParticipationCertificate(eventId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [MY_PARTICIPATION_CERT_KEY, eventId],
    queryFn: () => awardApi.getMyParticipationOptional(eventId!),
    enabled: !!eventId && enabled,
  });
}

export function useAssignAwards(eventId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => awardApi.assign(eventId!),
    onSuccess: () => {
      if (!eventId) return;
      queryClient.invalidateQueries({ queryKey: [AWARDS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [AWARDS_KEY, "public", eventId] });
      queryClient.invalidateQueries({ queryKey: [AWARDS_PARTICIPATION_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [AWARDS_PARTICIPATION_SUMMARY_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [MY_PARTICIPATION_CERT_KEY, eventId] });
    },
  });
}
