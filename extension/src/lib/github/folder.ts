import type { Submission } from '@/types/submission';
import { createProvider } from '@/lib/ai/index';
import { getActiveProviderConfig } from '@/background/ai';

/**
 * Uses the active AI provider to determine the correct folder path
 * by reading the repo's existing folder structure + user custom instructions.
 *
 * Returns a folder name like "Arrays", "MySQL", "DP", etc.
 * Falls back to the static TOPIC_FOLDER_MAP if AI call fails.
 */
export async function determineFolderWithAI(
  submission: Submission,
  existingFolders: string[],
  customInstructions?: string
): Promise<string> {
  const config = await getActiveProviderConfig();
  if (!config?.apiKey && config?.type !== 'ollama') {
    // No AI — fall back to static mapping
    return staticFolderMap(submission, existingFolders);
  }

  try {
    const provider = createProvider(config);

    const folderList = existingFolders
      .filter(f => !f.includes('/')) // top-level only
      .join(', ');

    const prompt = `You are a code repository organizer. 
Given a LeetCode problem submission, determine which existing folder in the repository it belongs to.

## Repository's existing top-level folders:
${folderList || '(empty repository — suggest a folder name)'}

## Problem details:
- Title: ${submission.title}
- LeetCode Topics: ${(submission.topics ?? []).join(', ') || 'N/A'}
- Language submitted in: ${submission.language}
- Is SQL/Database problem: ${submission.isSQL ? 'YES' : 'NO'}
- Difficulty: ${submission.difficulty}

${customInstructions ? `## User's custom instructions (FOLLOW THESE EXACTLY):
${customInstructions}

` : ''}## Instructions:
1. Look at the existing folders and pick the BEST MATCHING one.
2. If the problem is SQL/MySQL/Database type, prefer folders named "MySQL", "SQL", "Database", etc.
3. Use the EXACT folder name as it appears in the existing folders list.
4. If no folder matches, suggest a concise new folder name (CamelCase, no spaces).
5. Reply with ONLY the folder name — nothing else, no explanation, no quotes.

Folder name:`;

    const response = await provider.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      maxTokens: 20,
    });

    const folder = response.content.trim().replace(/['"]/g, '').split('\n')[0].trim();

    // Validate — must be a reasonable folder name
    if (folder && /^[\w\- ]+$/.test(folder) && folder.length < 50) {
      // Prefer exact match from existing folders (case-insensitive)
      const exact = existingFolders.find(
        f => f.toLowerCase() === folder.toLowerCase() && !f.includes('/')
      );
      return exact ?? folder;
    }
  } catch (err) {
    console.warn('[LeetCode AI Sync] AI folder determination failed, using static map:', err);
  }

  return staticFolderMap(submission, existingFolders);
}

/** Static fallback: match topics → folder names by keyword scanning */
function staticFolderMap(submission: Submission, existingFolders: string[]): string {
  const topLevelFolders = existingFolders.filter(f => !f.includes('/'));

  // SQL/DB problems
  if (submission.isSQL || ['mysql', 'sql', 'pandas'].includes(submission.language)) {
    const sqlFolder = topLevelFolders.find(f =>
      /mysql|sql|database|db/i.test(f)
    );
    if (sqlFolder) return sqlFolder;
    return 'MySQL';
  }

  const topics = (submission.topics ?? []).map(t => t.toLowerCase());

  // Try to find a matching existing folder by topic keywords
  const keywordMap: Array<[RegExp, string[]]> = [
    [/array|string|matrix|prefix|window|pointer|hash/i, ['array', 'arrays', 'string', 'strings']],
    [/binary.?search|divide/i, ['binarysearch', 'binary-search', 'bsearch']],
    [/dynamic.?program|dp|memo/i, ['dp', 'dynamic-programming', 'dynamicprogramming']],
    [/backtrack|recursi/i, ['backtracking', 'backtrack', 'recursion']],
    [/graph|bfs|dfs|topological|union.?find/i, ['graph', 'graphs']],
    [/tree|trie|segment/i, ['tree', 'trees']],
    [/link.?list/i, ['linkedlist', 'linked-list']],
    [/stack|monotonic/i, ['stack']],
    [/queue|heap|priority/i, ['queue', 'heap']],
    [/interval|sweep/i, ['interval', 'intervals']],
    [/sliding.?window/i, ['slidingwindow', 'sliding-window']],
    [/greedy/i, ['greedy']],
    [/bit.?manip/i, ['bitmanipulation', 'bit']],
    [/math/i, ['math', 'maths']],
  ];

  for (const topic of topics) {
    for (const [pattern, candidates] of keywordMap) {
      if (pattern.test(topic)) {
        const found = topLevelFolders.find(f =>
          candidates.some(c => f.toLowerCase().replace(/[\s_-]/g, '') === c.replace(/[\s_-]/g, ''))
        );
        if (found) return found;
      }
    }
  }

  // Fallback: first existing folder that matches any topic word
  for (const topic of topics) {
    const word = topic.replace(/\s+/g, '').toLowerCase();
    const match = topLevelFolders.find(f =>
      f.toLowerCase().replace(/[\s_-]/g, '').includes(word) ||
      word.includes(f.toLowerCase().replace(/[\s_-]/g, ''))
    );
    if (match) return match;
  }

  // Last resort defaults
  return topLevelFolders.find(f => /array/i.test(f)) ?? topLevelFolders[0] ?? 'Arrays';
}
