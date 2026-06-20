import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/features/teams/hooks/use-debounce";

export const GITHUB_REPO_KEY = "github-repo-info" as const;

// TODO: backend has no GitHub info endpoint — stub returns null
export function useGitHubRepo(repoUrl: string) {
  const debouncedUrl = useDebounce(repoUrl, 500);

  const isValidUrl =
    debouncedUrl.length > 0 && debouncedUrl.startsWith("http");

  return useQuery({
    queryKey: [GITHUB_REPO_KEY, debouncedUrl],
    queryFn: () => Promise.resolve(null),
    enabled: isValidUrl,
  });
}
