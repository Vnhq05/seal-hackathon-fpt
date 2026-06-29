"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth.api";
import { eventApi, type AddAllowedEmailDomainRequest } from "@/lib/api/event.api";

export function registrationAllowedDomainsQueryKey() {
  return ["registration-allowed-domains"] as const;
}

export function useRegistrationAllowedDomains() {
  return useQuery({
    queryKey: registrationAllowedDomainsQueryKey(),
    queryFn: () => authApi.listRegistrationAllowedDomains(),
  });
}

export function allowedEmailDomainsQueryKey(eventId: string) {
  return ["allowed-email-domains", eventId] as const;
}

export function publicAllowedEmailDomainsQueryKey(eventId: string) {
  return ["public-allowed-domains", eventId] as const;
}

export function useAllowedEmailDomains(eventId: string | undefined) {
  return useQuery({
    queryKey: allowedEmailDomainsQueryKey(eventId ?? ""),
    queryFn: () => eventApi.listAllowedEmailDomains(eventId!),
    enabled: Boolean(eventId),
  });
}

export function usePublicAllowedEmailDomains(eventId: string | undefined) {
  return useQuery({
    queryKey: publicAllowedEmailDomainsQueryKey(eventId ?? ""),
    queryFn: () => eventApi.listPublicAllowedEmailDomains(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useAddAllowedEmailDomain(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddAllowedEmailDomainRequest) =>
      eventApi.addAllowedEmailDomain(eventId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allowedEmailDomainsQueryKey(eventId) });
      queryClient.invalidateQueries({ queryKey: publicAllowedEmailDomainsQueryKey(eventId) });
    },
  });
}

export function useRemoveAllowedEmailDomain(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) => eventApi.removeAllowedEmailDomain(eventId, domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allowedEmailDomainsQueryKey(eventId) });
      queryClient.invalidateQueries({ queryKey: publicAllowedEmailDomainsQueryKey(eventId) });
    },
  });
}
