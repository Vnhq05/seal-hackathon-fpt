"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { registerForTrack } from "@/features/events/services/track-registration.service";
import type { TrackRegistrationRequest } from "@/features/events/types/track-registration.types";

export function useRegisterTrack(hackathonId: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (payload: TrackRegistrationRequest) =>
      registerForTrack(payload),
    onSuccess: () => {
      router.push(`/participant/projects/${hackathonId}?track_registered=true`);
    },
  });

  return {
    registerTrack: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
