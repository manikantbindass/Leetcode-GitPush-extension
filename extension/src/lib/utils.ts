import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind CSS classes safely. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Delay execution for a given number of milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retry an async function with exponential backoff. */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delay: number; backoff: number } = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 2,
  }
): Promise<T> {
  let lastError: Error = new Error('retry failed');
  let delay = options.delay;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < options.maxAttempts) {
        await sleep(delay);
        delay *= options.backoff;
      }
    }
  }
  throw lastError;
}

/** UTF-8 safe base64 encode (for GitHub API file content). */
export function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/** UTF-8 safe base64 decode. */
export function fromBase64(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

/** Convert a problem title to a URL-friendly slug. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Format a Unix timestamp as a readable date string. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Get relative time string (e.g. "2 hours ago"). */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Map a programming language identifier to its file extension. */
export function getFileExtension(language: string): string {
  const map: Record<string, string> = {
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
  return map[language.toLowerCase()] ?? 'txt';
}

/** Get the Tailwind CSS color class for a difficulty level. */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return 'text-green-400';
    case 'Medium':
      return 'text-yellow-400';
    case 'Hard':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

/** Get background color class for difficulty badges. */
export function getDifficultyBgClass(difficulty: string): string {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-400/10 text-green-400 border-green-400/20';
    case 'Medium':
      return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    case 'Hard':
      return 'bg-red-400/10 text-red-400 border-red-400/20';
    default:
      return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
  }
}

/** Normalize runtime string (e.g. "45 ms" → "45 ms"). */
export function formatRuntime(runtime: string): string {
  if (!runtime) return 'N/A';
  const ms = runtime.match(/\d+/)?.[0];
  return ms ? `${ms} ms` : runtime;
}

/** Normalize memory string (e.g. "16.2 MB" → "16.2 MB"). */
export function formatMemory(memory: string): string {
  if (!memory) return 'N/A';
  const mb = memory.match(/[\d.]+/)?.[0];
  return mb ? `${mb} MB` : memory;
}

/** Generate a unique ID using the browser crypto API. */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Pad a problem number to 4 digits (e.g. 1 → "0001"). */
export function padProblemNumber(num: number): string {
  return String(num).padStart(4, '0');
}

/** Get comment prefix for a given language. */
export function getCommentStyle(language: string): { single: string; blockStart?: string; blockEnd?: string } {
  const slashStyle = { single: '//', blockStart: '/*', blockEnd: '*/' };
  const hashStyle  = { single: '#',  blockStart: '#',  blockEnd: '#'  };
  const dashStyle  = { single: '--', blockStart: '--', blockEnd: '--' };
  const map: Record<string, { single: string; blockStart: string; blockEnd: string }> = {
    java: slashStyle,
    javascript: slashStyle,
    typescript: slashStyle,
    cpp: slashStyle,
    c: slashStyle,
    go: slashStyle,
    rust: slashStyle,
    kotlin: slashStyle,
    swift: slashStyle,
    csharp: slashStyle,
    dart: slashStyle,
    python: hashStyle,
    python3: hashStyle,
    ruby: hashStyle,
    php: hashStyle,
    pandas: hashStyle,
    sql: dashStyle,
  };
  return map[language.toLowerCase()] ?? slashStyle;
}

/** Get language display name. */
export function getLanguageDisplayName(lang: string): string {
  const names: Record<string, string> = {
    java: 'Java',
    python: 'Python',
    python3: 'Python 3',
    go: 'Go',
    cpp: 'C++',
    c: 'C',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    rust: 'Rust',
    kotlin: 'Kotlin',
    swift: 'Swift',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    dart: 'Dart',
    sql: 'SQL',
    pandas: 'Pandas',
  };
  return names[lang.toLowerCase()] ?? lang;
}

/** Get language emoji icon. */
export function getLanguageEmoji(lang: string): string {
  const emojis: Record<string, string> = {
    java: '☕',
    python: '🐍',
    python3: '🐍',
    go: '🐹',
    cpp: '⚡',
    c: '🔧',
    javascript: '🟨',
    typescript: '🔷',
    rust: '🦀',
    kotlin: '🟣',
    swift: '🍎',
    csharp: '💜',
    php: '🐘',
    ruby: '💎',
    dart: '🎯',
    sql: '🗄️',
    pandas: '🐼',
  };
  return emojis[lang.toLowerCase()] ?? '📄';
}
