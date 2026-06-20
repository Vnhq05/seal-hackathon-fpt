export interface SubmitProjectRequest {
  repositoryUrl: string;
  demoUrl: string;
  documentationUrl: string;
  slideUrl: string;
  isDraft: boolean;
}

export interface SubmitProjectResponse {
  id: string;
  message: string;
}

export interface RoundInfo {
  id: string;
  name: string;
  subtitle: string;
  deadline: string;
  timeRemaining: string;
}

export interface GitHubRepoInfo {
  fullName: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
}
