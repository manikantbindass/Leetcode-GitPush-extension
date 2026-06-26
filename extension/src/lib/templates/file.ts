import type { ComplexityInfo } from '@/types/ai';
import type { Submission } from '@/types/submission';
import { getCommentStyle } from '@/lib/utils';

/**
 * Build a complete solution file with metadata header + clean code.
 */
export function buildSolutionFile(
  submission: Submission,
  language: string,
  code: string,
  complexity: ComplexityInfo,
  explanation: string
): string {
  const { single } = getCommentStyle(language);
  const line = single.repeat(1) + ' ' + '─'.repeat(70);
  const sep = single.repeat(1) + ' ';

  const header = [
    line,
    `${sep}LeetCode #${submission.problemNumber} · ${submission.title}`,
    `${sep}Difficulty : ${submission.difficulty}`,
    `${sep}Topics     : ${submission.topics.join(', ') || 'N/A'}`,
    `${sep}URL        : ${submission.url}`,
    line,
    `${sep}Approach`,
    ...wordWrap(explanation, 70).map(l => `${sep}  ${l}`),
    sep,
    `${sep}Complexity`,
    `${sep}  Time  : ${complexity.time}`,
    `${sep}  Space : ${complexity.space}`,
    sep,
    `${sep}Runtime  : ${submission.runtime}`,
    `${sep}Memory   : ${submission.memory}`,
    sep,
    `${sep}Examples`,
    ...submission.examples.flatMap((ex, i) => [
      `${sep}  Example ${i + 1}:`,
      `${sep}    Input  : ${ex.input}`,
      `${sep}    Output : ${ex.output}`,
      ...(ex.explanation ? [`${sep}    Explanation: ${ex.explanation}`] : []),
    ]),
    sep,
    `${sep}Constraints`,
    ...submission.constraints.map(c => `${sep}  · ${c}`),
    line,
  ].join('\n');

  return `${header}\n\n${code.trim()}\n`;
}

function wordWrap(text: string, maxLen: number): string[] {
  if (!text) return [''];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxLen) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
