import type { TreeItem } from '@/types/github';
import type { OutputLanguage } from '@/types/submission';

/** Language → file extension map */
const LANG_EXT: Record<string, string> = {
  java: 'java',
  python: 'py',
  python3: 'py',
  go: 'go',
  cpp: 'cpp',
  c: 'c',
  javascript: 'js',
  typescript: 'ts',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  csharp: 'cs',
  php: 'php',
  ruby: 'rb',
  dart: 'dart',
  sql: 'sql',
  pandas: 'py',
};

/**
 * LeetCode topic → repo folder name mappings.
 * Keys are lowercase LeetCode topic names (partial match OK).
 * Values are the EXACT folder names as they appear in the repo.
 */
const TOPIC_FOLDER_MAP: Record<string, string> = {
  // Arrays / Strings
  'array':           'Arrays',
  'string':          'Arrays',
  'matrix':          'Arrays',
  'sorting':         'Arrays',
  'prefix sum':      'Arrays',
  'sliding window':  'Arrays',
  'two pointers':    'Arrays',

  // Hashing
  'hash table':      'Arrays',
  'hash map':        'Arrays',
  'hash set':        'Arrays',

  // Binary Search
  'binary search':   'BinarySearch',
  'divide and conquer': 'BinarySearch',

  // Linked List
  'linked list':     'LinkedList',

  // Trees
  'tree':            'Trees',
  'binary tree':     'Trees',
  'binary search tree': 'Trees',
  'segment tree':    'Trees',
  'trie':            'Trees',

  // Graphs
  'graph':           'Graphs',
  'bfs':             'Graphs',
  'breadth-first search': 'Graphs',
  'dfs':             'Graphs',
  'depth-first search': 'Graphs',
  'topological sort': 'Graphs',
  'union find':      'Graphs',
  'shortest path':   'Graphs',

  // Dynamic Programming
  'dynamic programming': 'DP',
  'memoization':     'DP',
  'dp':              'DP',

  // Backtracking
  'backtracking':    'Backtracking',

  // Greedy
  'greedy':          'Greedy',

  // Stack / Queue
  'stack':           'Stack',
  'queue':           'Queue',
  'monotonic stack': 'Stack',
  'monotonic queue': 'Queue',

  // Heap
  'heap':            'Heap',
  'priority queue':  'Heap',

  // Intervals
  'intervals':       'Intervals',
  'interval':        'Intervals',
  'sweep line':      'Intervals',

  // Math / Bit Manipulation
  'math':            'Math',
  'bit manipulation': 'BitManipulation',
  'number theory':   'Math',
  'geometry':        'Math',

  // Recursion
  'recursion':       'Backtracking',
  'iteration':       'Arrays',

  // SQL
  'database':        'SQL',
  'sql':             'SQL',
};

/**
 * Convert a problem title to CamelCase for file naming.
 * "Two Sum" → "TwoSum"
 * "Best Time to Buy and Sell Stock II" → "BestTimeToBuyAndSellStockII"
 */
export function toCamelCase(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove special chars
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Find the best matching folder in the repo tree for a given list of LeetCode topics.
 * Strategy:
 *   1. Scan existing tree for folders matching known topic names
 *   2. Match LeetCode topics against TOPIC_FOLDER_MAP
 *   3. If the mapped folder exists in tree → use it
 *   4. If mapped folder doesn't exist → use the mapped name anyway (will be created)
 *   5. Fallback: 'Arrays'
 */
export function findTopicDirectory(
  tree: TreeItem[],
  topics: string[],
  _topicMapping: Record<string, string> = {}
): string {
  // Get all existing top-level directories
  const existingDirs = new Set(
    tree
      .filter(t => t.type === 'tree' && !t.path.includes('/'))
      .map(t => t.path)
  );

  // Try each topic in priority order
  for (const topic of topics) {
    const lower = topic.toLowerCase().trim();

    // Check exact match against TOPIC_FOLDER_MAP
    for (const [key, folder] of Object.entries(TOPIC_FOLDER_MAP)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) {
        // If folder exists in repo, use it; otherwise use the mapped name
        if (existingDirs.has(folder)) return folder;
        // Try case-insensitive match against existing dirs
        const existing = [...existingDirs].find(
          d => d.toLowerCase() === folder.toLowerCase()
        );
        if (existing) return existing;
        // Folder doesn't exist yet — return the mapped name, GitHub will create it
        return folder;
      }
    }
  }

  // Fuzzy fallback: check if any existing dir name contains a topic word
  for (const topic of topics) {
    const lower = topic.toLowerCase().replace(/\s+/g, '');
    const match = [...existingDirs].find(
      d => d.toLowerCase().replace(/[\s_-]/g, '').includes(lower) ||
           lower.includes(d.toLowerCase().replace(/[\s_-]/g, ''))
    );
    if (match) return match;
  }

  // Final fallback
  return existingDirs.has('Arrays') ? 'Arrays' : (existingDirs.values().next().value ?? 'Arrays');
}

/**
 * Build the full file path for a solution.
 *
 * Format (matching your repo): `{TopicFolder}/{CamelCaseTitle}.{ext}`
 * Example: `Arrays/TwoSum.java`, `DP/ClimbingStairs.py`, `Graphs/NumberOfIslands.go`
 *
 * The `style` param is kept for backward compatibility but the primary format
 * is always `{folder}/{CamelCaseTitle}.{ext}` to match existing repo structure.
 */
export function buildFilePath(
  topicDir: string,
  _problemNumber: number,
  title: string,
  language: string | OutputLanguage,
  _style: string = 'number-slug'
): string {
  const ext = LANG_EXT[language] ?? language;
  const fileName = toCamelCase(title);
  const folder = topicDir || 'Arrays';
  return `${folder}/${fileName}.${ext}`;
}
