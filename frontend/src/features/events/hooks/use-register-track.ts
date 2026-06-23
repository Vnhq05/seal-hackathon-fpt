"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

/**
 * TODO: "Tracks" do not exist in the backend -- they have been replaced by "criteria".
 * This hook previously called POST /hackathons/{id}/tracks/register which is not a valid
 * endpoint. Once the UI is redesigned around criteria, replace this with the appropriate
 * criteriaApi call. For now the mutation is a no-op placeholder.
 */
export function useRegisterTrack(hackathonId: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (_payload: {
      hackathonId: string;
      teamId: string;
      trackId: string;
    }) => {
      // TODO: Replace with criteriaApi call when tracks are redesigned as criteria
      // The old endpoint POST /hackathons/{hackathonId}/tracks/register does not exist.
      console.warn(
        "[useRegisterTrack] Track registration is not available -- tracks have been replaced by criteria in the backend.",
      );
      return { message: "Not implemented", registrationId: "" };
    },
    onSuccess: () => {
      router.push(`/student/projects/${hackathonId}?track_registered=true`);
    },
  });

  return {
    registerTrack: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
