export interface GitHubRepoInfo {
  fullName: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
}
