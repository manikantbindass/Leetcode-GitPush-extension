export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  default_branch: string;
  private: boolean;
  html_url: string;
}

export interface TreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  url: string;
}

export interface CommitFile {
  path: string;
  content: string; // base64 encoded
}

export interface GitHubCommitResult {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    url: string;
  };
}
