import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/features/teams/hooks/use-debounce";
import { fetchGitHubRepoInfo } from "@/features/submissions/services/submit-project.service";

export const GITHUB_REPO_KEY = "github-repo-info" as const;

export function useGitHubRepo(repoUrl: string) {
  const debouncedUrl = useDebounce(repoUrl, 500);

  const isValidUrl =
    debouncedUrl.length > 0 && debouncedUrl.startsWith("http");

  return useQuery({
    queryKey: [GITHUB_REPO_KEY, debouncedUrl],
    queryFn: () => fetchGitHubRepoInfo(debouncedUrl),
    enabled: isValidUrl,
  });
}
