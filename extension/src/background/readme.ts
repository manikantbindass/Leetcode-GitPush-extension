import type { Repository } from '@/types/github';
import type { Submission } from '@/types/submission';
import { GitHubAPI } from '@/lib/github/api';
import { buildReadme, updateReadme } from '@/lib/templates/readme';
import * as storage from '@/lib/storage';

export async function updateRepositoryReadme(
  github: GitHubAPI,
  repo: Repository,
  branch: string,
  _submission: Submission
): Promise<void> {
  try {
    const stats = (await storage.get('solvedStats')) ?? {
      easy: 0, medium: 0, hard: 0, total: 0,
    };
    const recent = (await storage.get('recentSubmissions')) ?? [];

    // Fetch existing README
    const existing = await github.getFileContent(
      repo.owner, repo.name, 'README.md', branch
    );

    let newContent: string;
    if (existing) {
      newContent = updateReadme(existing.content, stats, recent, repo.name);
    } else {
      newContent = buildReadme(stats, recent, repo.name);
    }

    await github.createOrUpdateFile(
      repo.owner,
      repo.name,
      'README.md',
      newContent,
      'docs: update README with latest LeetCode solutions [skip ci]',
      branch,
      existing?.sha
    );
  } catch (err) {
    // README update is non-critical — log but don't fail the whole sync
    console.warn('[LeetCode AI Sync] README update failed:', err);
  }
}
