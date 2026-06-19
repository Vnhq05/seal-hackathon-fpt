import { useQuery } from "@tanstack/react-query";
import { fetchMySubmissions } from "@/features/submissions/services/submission.service";

export const MY_SUBMISSIONS_KEY = "my-submissions" as const;

export function useMySubmissions() {
  return useQuery({
    queryKey: [MY_SUBMISSIONS_KEY],
    queryFn: fetchMySubmissions,
  });
}
