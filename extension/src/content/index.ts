import type { Difficulty, Example, Language, Submission } from '@/types/submission';
import { generateId } from '@/lib/utils';

// ─── Inject interceptor into page main world ─────────────────────────────
const script = document.createElement('script');
script.src = chrome.runtime.getURL('src/content/injected.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// ─── Listen for messages from the injected script ────────────────────────
window.addEventListener('message', async event => {
  if (event.source !== window) return;
  if (event.data?.type !== 'LEETCODE_SUBMISSION_ACCEPTED') return;

  const raw = event.data.payload;
  if (!raw?.submissionId) return;

  showToast('🔍 LeetCode AI Sync: fetching metadata…', 'info');

  try {
    // Fetch rich metadata via GraphQL
    const slug = raw.titleSlug || extractSlugFromUrl();
    const meta = await fetchGraphQLMetadata(slug);

    const submission: Submission = {
      id: generateId(),
      problemNumber: meta.problemNumber || raw.problemNumber || 0,
      title: meta.title || raw.title || slug,
      titleSlug: slug,
      difficulty: (meta.difficulty || raw.difficulty || 'Medium') as Difficulty,
      topics: meta.topics?.length ? meta.topics : raw.topics ?? [],
      constraints: meta.constraints ?? [],
      examples: meta.examples ?? [],
      description: meta.description ?? '',
      language: (raw.language || 'javascript') as Language,
      code: raw.code ?? '',
      runtime: raw.runtime ?? '',
      memory: raw.memory ?? '',
      url: `https://leetcode.com/problems/${slug}/`,
      timestamp: Date.now(),
      isSQL: isSQL(raw.language ?? ''),
    };

    chrome.runtime.sendMessage({
      type: 'SUBMISSION_DETECTED',
      payload: submission,
    });

    showToast('✅ LeetCode AI Sync: syncing to GitHub…', 'success');
  } catch (err) {
    console.error('[LeetCode AI Sync] Error:', err);
    showToast('❌ LeetCode AI Sync: failed to process submission', 'error');
  }
});

// ─── GraphQL metadata fetch ───────────────────────────────────────────────
async function fetchGraphQLMetadata(titleSlug: string): Promise<Partial<Submission>> {
  if (!titleSlug) return {};

  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        topicTags { name slug }
        content
        exampleTestcases
        constraints: content
      }
    }
  `;

  const response = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables: { titleSlug } }),
  });

  if (!response.ok) throw new Error(`GraphQL ${response.status}`);
  const data = await response.json();
  const q = data?.data?.question;
  if (!q) return {};

  const content = q.content ?? '';
  return {
    problemNumber: parseInt(q.questionId, 10),
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty as Difficulty,
    topics: (q.topicTags ?? []).map((t: any) => t.name as string),
    description: stripHTML(content),
    constraints: parseConstraints(content),
    examples: parseExamples(q.exampleTestcases ?? '', content),
    url: `https://leetcode.com/problems/${titleSlug}/`,
  };
}

// ─── HTML / text helpers ──────────────────────────────────────────────────
function stripHTML(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseConstraints(html: string): string[] {
  const constraintSection = html.match(
    /<strong[^>]*>Constraints?:?<\/strong>([\s\S]*?)(?=<strong|$)/i
  );
  if (!constraintSection) return [];
  return stripHTML(constraintSection[1])
    .split('\n')
    .map(s => s.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean);
}

function parseExamples(testcases: string, html: string): Example[] {
  const examples: Example[] = [];

  // Try to extract from HTML
  const exampleMatches = html.matchAll(
    /<strong[^>]*>Example\s*\d+:?<\/strong>([\s\S]*?)(?=<strong[^>]*>Example|<strong[^>]*>Constraints|$)/gi
  );

  for (const match of exampleMatches) {
    const block = stripHTML(match[1]);
    const inputMatch = block.match(/Input:([^\n]+)/i);
    const outputMatch = block.match(/Output:([^\n]+)/i);
    const explanMatch = block.match(/Explanation:([^\n]+)/i);
    if (inputMatch && outputMatch) {
      examples.push({
        input: inputMatch[1].trim(),
        output: outputMatch[1].trim(),
        explanation: explanMatch?.[1].trim(),
      });
    }
  }

  if (examples.length === 0 && testcases) {
    // Fallback: use raw test cases
    testcases.split('\n').forEach((line, i) => {
      if (i % 2 === 0) {
        examples.push({ input: line, output: testcases.split('\n')[i + 1] ?? '' });
      }
    });
  }

  return examples;
}

function extractSlugFromUrl(): string {
  const m = window.location.pathname.match(/\/problems\/([\w-]+)\//);
  return m?.[1] ?? '';
}

function isSQL(lang: string): boolean {
  return ['mysql', 'mssql', 'oraclesql', 'postgresql', 'sql', 'pandas'].includes(
    lang.toLowerCase()
  );
}

// ─── Toast notification (Shadow DOM) ────────────────────────────────────
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#4f6ef7',
  };

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .toast {
      background: #12152a;
      border: 1px solid ${colors[type]}40;
      border-left: 3px solid ${colors[type]};
      color: #e2e8f0;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
      max-width: 320px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: slideIn 0.2s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `;

  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;

  shadow.appendChild(style);
  shadow.appendChild(div);
  document.body.appendChild(host);

  setTimeout(() => {
    host.style.transition = 'opacity 0.3s';
    host.style.opacity = '0';
    setTimeout(() => host.remove(), 300);
  }, 3000);
}
