"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { enrollmentApi } from "@/lib/api";

export function useHackathonRegistration(hackathonId: string) {
  const router = useRouter();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => enrollmentApi.enroll(hackathonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollment", hackathonId] });
      qc.invalidateQueries({ queryKey: ["enrollment", "my-active"] });
      qc.invalidateQueries({ queryKey: ["my-teams-all-events"] });
      router.push("/student/teams?registered=true");
    },
  });

  return {
    register: () => mutation.mutate(),
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
