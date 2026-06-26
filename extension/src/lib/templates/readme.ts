import type { SolvedStats } from '@/types/storage';
import type { Submission } from '@/types/submission';
import { formatDate, getDifficultyColor } from '@/lib/utils';

const MARKER_START = '<!-- LEETCODE-AI-SYNC:START -->';
const MARKER_END = '<!-- LEETCODE-AI-SYNC:END -->';

/**
 * Build a fresh README.md for the repo.
 */
export function buildReadme(
  stats: SolvedStats,
  recentSubmissions: Submission[],
  repoName: string
): string {
  const block = buildStatsBlock(stats, recentSubmissions, repoName);
  return `${MARKER_START}\n${block}\n${MARKER_END}\n`;
}

/**
 * Update the README by replacing the managed block, or prepending if not found.
 */
export function updateReadme(
  existing: string,
  stats: SolvedStats,
  recentSubmissions: Submission[],
  repoName: string
): string {
  const block = buildStatsBlock(stats, recentSubmissions, repoName);
  const replacement = `${MARKER_START}\n${block}\n${MARKER_END}`;

  if (existing.includes(MARKER_START)) {
    return existing.replace(
      new RegExp(`${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`),
      replacement
    );
  }
  // Prepend our block
  return `${replacement}\n\n${existing}`;
}

function buildStatsBlock(
  stats: SolvedStats,
  recentSubmissions: Submission[],
  repoName: string
): string {
  const easyBadge = `![Easy](https://img.shields.io/badge/Easy-${stats.easy}-22c55e?style=flat-square)`;
  const mediumBadge = `![Medium](https://img.shields.io/badge/Medium-${stats.medium}-f59e0b?style=flat-square)`;
  const hardBadge = `![Hard](https://img.shields.io/badge/Hard-${stats.hard}-ef4444?style=flat-square)`;
  const totalBadge = `![Total](https://img.shields.io/badge/Total-${stats.total}-4f6ef7?style=flat-square)`;

  const recentRows = recentSubmissions
    .slice(0, 10)
    .map(s => {
      const diff = s.difficulty;
      const emoji = diff === 'Easy' ? '🟢' : diff === 'Medium' ? '🟡' : '🔴';
      const topics = s.topics.slice(0, 3).join(', ');
      return `| [#${s.problemNumber} ${s.title}](${s.url}) | ${emoji} ${diff} | ${topics} | ${formatDate(s.timestamp)} |`;
    })
    .join('\n');

  return `# 📚 ${repoName} — LeetCode Solutions

> Auto-maintained by [LeetCode AI Sync](https://github.com/manikantbindass/Leetcode-GitPush-extension) ✨

## 📊 Progress

${totalBadge} ${easyBadge} ${mediumBadge} ${hardBadge}

| Difficulty | Solved |
|-----------|--------|
| 🟢 Easy   | ${stats.easy} |
| 🟡 Medium | ${stats.medium} |
| 🔴 Hard   | ${stats.hard} |
| **Total** | **${stats.total}** |

## 🕐 Recent Submissions

| Problem | Difficulty | Topics | Date |
|---------|-----------|--------|------|
${recentRows || '| — | — | — | — |'}

---
*Last updated: ${new Date().toUTCString()}*`;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
