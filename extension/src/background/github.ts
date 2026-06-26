import type { Repository } from '@/types/github';
import type { CommitFile } from '@/types/github';
import type { Submission } from '@/types/submission';
import { GitHubAPI } from '@/lib/github/api';
import * as storage from '@/lib/storage';
import { toBase64 } from '@/lib/utils';

export async function getGitHubClient(): Promise<GitHubAPI | null> {
  const token = await storage.get('githubToken');
  if (!token) return null;
  return new GitHubAPI(token);
}

export interface SyncOptions {
  submission: Submission;
  files: Array<{ path: string; content: string }>;
  commitMessage: string;
  repo: Repository;
  branch: string;
  dryRun: boolean;
}

export interface SyncResult {
  success: boolean;
  commitUrl?: string;
  filesCreated: string[];
  error?: string;
}

export async function syncToGitHub(opts: SyncOptions): Promise<SyncResult> {
  const { files, commitMessage, repo, branch, dryRun } = opts;

  if (dryRun) {
    console.log('[DRY RUN] Would commit files:', files.map(f => f.path));
    return { success: true, filesCreated: files.map(f => f.path) };
  }

  const github = await getGitHubClient();
  if (!github) return { success: false, filesCreated: [], error: 'Not authenticated' };

  try {
    const commitFiles: CommitFile[] = files.map(f => ({
      path: f.path,
      content: toBase64(f.content),
    }));

    const result = await github.batchCommit(
      repo.owner,
      repo.name,
      branch,
      commitFiles,
      commitMessage
    );

    return {
      success: true,
      commitUrl: result.html_url,
      filesCreated: files.map(f => f.path),
    };
  } catch (err: any) {
    // Fallback: try individual file updates
    if (err?.message?.includes('409') || err?.message?.includes('conflict')) {
      return fallbackIndividualUpdate(github, opts);
    }
    return { success: false, filesCreated: [], error: String(err) };
  }
}

async function fallbackIndividualUpdate(
  github: GitHubAPI,
  opts: SyncOptions
): Promise<SyncResult> {
  const created: string[] = [];
  const { files, commitMessage, repo, branch } = opts;

  for (const file of files) {
    try {
      // Check if file exists (get SHA)
      const existing = await github.getFileContent(
        repo.owner, repo.name, file.path, branch
      );
      await github.createOrUpdateFile(
        repo.owner, repo.name, file.path, file.content,
        commitMessage, branch, existing?.sha
      );
      created.push(file.path);
    } catch (err) {
      console.error(`[GitHub] Failed to update ${file.path}:`, err);
    }
  }

  return { success: created.length > 0, filesCreated: created };
}

export async function fetchAndCacheRepoTree(
  repo: Repository,
  branch: string
): Promise<string[]> {
  const github = await getGitHubClient();
  if (!github) return [];

  const tree = await github.getRepositoryTree(repo.owner, repo.name, branch);
  const dirs = tree.filter(t => t.type === 'tree').map(t => t.path);

  await storage.setMany({
    repoTree: dirs,
    repoTreeFetchedAt: Date.now(),
  });
  return dirs;
}

export function buildCommitMessage(template: string, submission: Submission): string {
  return template
    .replace('{title}', submission.title)
    .replace('{number}', String(submission.problemNumber))
    .replace('{difficulty}', submission.difficulty)
    .replace('{language}', submission.language)
    .replace('{topics}', submission.topics.slice(0, 3).join(', '));
}
