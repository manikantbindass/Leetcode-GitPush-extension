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
  if (!github) return { success: false, filesCreated: [], error: 'Not authenticated with GitHub' };

  if (files.length === 0) {
    return { success: false, filesCreated: [], error: 'No files to commit — AI may have returned empty solutions' };
  }

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
    return { success: false, filesCreated: [], error: String(err) };
  }
}

export async function fetchAndCacheRepoTree(
  repo: Repository,
  branch: string
): Promise<string[]> {
  const github = await getGitHubClient();
  if (!github) return [];

  try {
    const tree = await github.getRepositoryTree(repo.owner, repo.name, branch);
    const dirs = tree.filter(t => t.type === 'tree').map(t => t.path);
    await storage.setMany({
      repoTree: dirs,
      repoTreeItems: tree,          // store full items for findTopicDirectory
      repoTreeFetchedAt: Date.now(),
    });
    return dirs;
  } catch {
    return [];
  }
}

export function buildCommitMessage(template: string, submission: Submission): string {
  const safe = (v: string | number | undefined, fallback: string) =>
    v !== undefined && v !== null && String(v).trim() ? String(v) : fallback;

  return (template || 'feat: add {title} (#{number})')
    .replace('{title}', safe(submission.title, 'Unknown Problem'))
    .replace('{number}', safe(submission.problemNumber, '0'))
    .replace('{difficulty}', safe(submission.difficulty, 'Unknown'))
    .replace('{language}', safe(submission.language, 'unknown'))
    .replace('{topics}', (submission.topics ?? []).slice(0, 3).join(', ') || 'general');
}
