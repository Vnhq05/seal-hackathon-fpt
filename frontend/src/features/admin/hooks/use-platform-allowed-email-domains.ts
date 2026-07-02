import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemConfigApi, type AddAllowedEmailDomainRequest } from "@/lib/api";
import { registrationAllowedDomainsQueryKey } from "@/features/events/hooks/use-allowed-email-domains";

export const PLATFORM_ALLOWED_EMAIL_DOMAINS_KEY = "platform-allowed-email-domains" as const;

export function usePlatformAllowedEmailDomains() {
  return useQuery({
    queryKey: [PLATFORM_ALLOWED_EMAIL_DOMAINS_KEY],
    queryFn: () => systemConfigApi.listAllowedEmailDomains(),
  });
}

export function useAddPlatformAllowedEmailDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddAllowedEmailDomainRequest) => systemConfigApi.addAllowedEmailDomain(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLATFORM_ALLOWED_EMAIL_DOMAINS_KEY] });
      queryClient.invalidateQueries({ queryKey: registrationAllowedDomainsQueryKey() });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "allowed-email-domains" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "public-allowed-domains" });
    },
  });
}

export function useRemovePlatformAllowedEmailDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domainId: string) => systemConfigApi.removeAllowedEmailDomain(domainId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLATFORM_ALLOWED_EMAIL_DOMAINS_KEY] });
      queryClient.invalidateQueries({ queryKey: registrationAllowedDomainsQueryKey() });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "allowed-email-domains" });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "public-allowed-domains" });
    },
  });
}
