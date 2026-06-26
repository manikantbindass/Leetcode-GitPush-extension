import type { TreeItem } from '@/types/github';
import type { FileNamingStyle } from '@/types/storage';
import { getFileExtension, padProblemNumber, slugify } from '@/lib/utils';

/**
 * Find a matching directory in the repo tree for given problem topics.
 * Checks user-defined topic mapping first, then fuzzy-matches tree folder names.
 */
export function findTopicDirectory(
  tree: TreeItem[],
  topics: string[],
  topicMapping: Record<string, string> = {}
): string | null {
  const directories = tree
    .filter(item => item.type === 'tree')
    .map(item => item.path);

  // 1. Check user-defined topic mapping first
  for (const topic of topics) {
    const mapped = topicMapping[topic] ?? topicMapping[topic.toLowerCase()];
    if (mapped && directories.includes(mapped)) return mapped;
  }

  // 2. Fuzzy match: normalize topic and directory names, find overlap
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\s_\-]/g, '').replace(/&/g, 'and');

  for (const topic of topics) {
    const normTopic = normalize(topic);
    const match = directories.find(dir => {
      const dirName = dir.split('/').pop() ?? dir;
      return normalize(dirName) === normTopic;
    });
    if (match) return match;
  }

  // 3. Partial match (topic contained in dir name or vice versa)
  for (const topic of topics) {
    const normTopic = normalize(topic);
    const match = directories.find(dir => {
      const dirName = normalize(dir.split('/').pop() ?? dir);
      return dirName.includes(normTopic) || normTopic.includes(dirName);
    });
    if (match) return match;
  }

  return null;
}

/**
 * Build the full file path for a solution file.
 */
export function buildFilePath(
  basePath: string | null,
  problemNumber: number,
  title: string,
  language: string,
  style: FileNamingStyle
): string {
  const ext = getFileExtension(language);
  const paddedNum = padProblemNumber(problemNumber);
  const slug = slugify(title);

  let folderName: string;
  let fileName: string;

  switch (style) {
    case 'slug':
      folderName = slug;
      fileName = `${slug}.${ext}`;
      break;
    case 'number-title':
      folderName = `${paddedNum}-${title.toLowerCase().replace(/\s+/g, '-')}`;
      fileName = `${paddedNum}-${slug}.${ext}`;
      break;
    case 'number-slug':
    default:
      folderName = `${paddedNum}-${slug}`;
      fileName = `${paddedNum}-${slug}.${ext}`;
      break;
  }

  if (basePath) {
    return `${basePath}/${folderName}/${fileName}`;
  }
  return `${folderName}/${fileName}`;
}

/**
 * Get only directory paths from a tree.
 */
export function getDirectoryPaths(tree: TreeItem[]): string[] {
  return tree.filter(item => item.type === 'tree').map(item => item.path);
}
