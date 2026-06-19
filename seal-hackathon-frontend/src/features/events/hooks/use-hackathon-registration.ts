"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerForHackathon } from "@/features/events/services/hackathon-registration.service";
import type { HackathonRegistrationRequest } from "@/features/events/types/hackathon-registration.types";
import type { HackathonRegistrationFormValues } from "@/features/events/schemas/hackathon-registration.schema";

export function useHackathonRegistration(hackathonId: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: HackathonRegistrationRequest) =>
      registerForHackathon(payload),
    onSuccess: () => {
      router.push(`/participant/projects/${hackathonId}?registered=true`);
    },
  });

  return {
    register: (values: HackathonRegistrationFormValues) =>
      mutation.mutate({
        hackathonId,
        ...values,
      }),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
