import type { CommitFile, GitHubCommitResult, GitHubUser, Repository, TreeItem } from '@/types/github';

const GITHUB_API = 'https://api.github.com';

export class GitHubAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${GITHUB_API}${path}`, {
      ...options,
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API ${response.status}: ${err.message ?? response.statusText}`);
    }
    if (response.status === 204) return {} as T;
    return response.json();
  }

  async getUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user');
  }

  async listRepositories(): Promise<Repository[]> {
    const repos: Repository[] = [];
    let page = 1;
    while (true) {
      const batch = await this.request<any[]>(
        `/user/repos?per_page=100&page=${page}&sort=updated&type=all`
      );
      if (!batch.length) break;
      repos.push(
        ...batch.map(r => ({
          id: r.id,
          full_name: r.full_name,
          name: r.name,
          owner: r.owner.login,
          default_branch: r.default_branch,
          private: r.private,
          html_url: r.html_url,
        }))
      );
      if (batch.length < 100) break;
      page++;
    }
    return repos;
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const branches = await this.request<any[]>(
      `/repos/${owner}/${repo}/branches?per_page=100`
    );
    return branches.map(b => b.name);
  }

  async getRepositoryTree(
    owner: string,
    repo: string,
    branch: string
  ): Promise<TreeItem[]> {
    const data = await this.request<any>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    return (data.tree ?? []).map((item: any) => ({
      path: item.path,
      type: item.type,
      sha: item.sha,
      url: item.url,
    }));
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const data = await this.request<any>(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );
      const content = decodeURIComponent(
        escape(atob(data.content.replace(/\n/g, '')))
      );
      return { content, sha: data.sha };
    } catch {
      return null;
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ): Promise<GitHubCommitResult> {
    const body: Record<string, unknown> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch,
    };
    if (sha) body.sha = sha;
    const data = await this.request<any>(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return {
      sha: data.commit.sha,
      html_url: data.commit.html_url,
      commit: { message: data.commit.message, url: data.commit.url },
    };
  }

  async batchCommit(
    owner: string,
    repo: string,
    branch: string,
    files: CommitFile[],
    message: string
  ): Promise<GitHubCommitResult> {
    // 1. Get latest commit SHA for the branch
    const refData = await this.request<any>(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`
    );
    const latestCommitSha: string = refData.object.sha;

    // 2. Get the tree SHA from that commit
    const commitData = await this.request<any>(
      `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
    );
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async file => {
        const blob = await this.request<any>(
          `/repos/${owner}/${repo}/git/blobs`,
          {
            method: 'POST',
            body: JSON.stringify({ content: file.content, encoding: 'base64' }),
          }
        );
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      })
    );

    // 4. Create a new tree
    const newTree = await this.request<any>(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    // 5. Create the commit
    const newCommit = await this.request<any>(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    });

    // 6. Move the branch ref to the new commit
    await this.request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    return {
      sha: newCommit.sha,
      html_url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      commit: { message: newCommit.message, url: newCommit.url },
    };
  }
}
