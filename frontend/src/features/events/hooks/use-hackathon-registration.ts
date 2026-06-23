"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { teamApi } from "@/lib/api";

/**
 * Registration for an event is done by creating a team via teamApi.create().
 * The old hackathon-specific registration endpoint (POST /hackathons/{id}/register)
 * does not exist in the backend. The form values (confirmStudent, agreeCodeOfConduct,
 * agreeTeamFormation) are front-end-only agreements -- the actual backend action is
 * creating a team under the event.
 */
export function useHackathonRegistration(hackathonId: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (teamName: string) =>
      teamApi.create(hackathonId, { name: teamName }),
    onSuccess: () => {
      router.push(`/student/projects/${hackathonId}?registered=true`);
    },
  });

  return {
    /**
     * Creates a team for the event, which serves as the registration action.
     * The caller should supply a team name.
     */
    register: (teamName: string) => mutation.mutate(teamName),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
