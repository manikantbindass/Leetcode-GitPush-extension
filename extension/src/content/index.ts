import type { Difficulty, Example, Language, Submission } from '@/types/submission';
import { generateId } from '@/lib/utils';

/**
 * Check if the extension context is still valid before calling chrome APIs.
 * Context becomes invalid when the extension is reloaded while this content
 * script is still alive on the page. All chrome.runtime calls will throw
 * "Extension context invalidated" in that state.
 */
function isContextValid(): boolean {
  try {
    // chrome.runtime.id is undefined when context is invalidated
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

/**
 * Safely send a message to the background service worker.
 * Returns false (no-op) if context is invalidated instead of throwing.
 */
function safeSendToBackground(message: unknown): boolean {
  if (!isContextValid()) {
    console.warn('[LeetCode AI Sync] Extension context invalidated — reload the LeetCode tab to re-activate.');
    return false;
  }
  try {
    chrome.runtime.sendMessage(message);
    return true;
  } catch (err) {
    const msg = String(err);
    if (msg.includes('Extension context invalidated') || msg.includes('Cannot read properties of undefined')) {
      console.warn('[LeetCode AI Sync] Context invalidated during sendMessage — tab needs refresh.');
      showToast('⚡ Extension updated — please refresh this tab to re-activate sync', 'info');
    } else {
      throw err; // re-throw unexpected errors
    }
    return false;
  }
}

// ─── Inject interceptor into page main world ─────────────────────────────
if (isContextValid()) {
  injectScript();
}

function injectScript() {
  if (!isContextValid()) return;
  const script = document.createElement('script');
  try {
    script.src = chrome.runtime.getURL('src/content/injected.js');
  } catch {
    return; // context gone between check and getURL
  }
  script.onload = () => script.remove();
  script.onerror = () => {
    console.error('[LeetCode AI Sync] Failed to inject interceptor script');
  };
  (document.head || document.documentElement).appendChild(script);
}

// ─── Listen for messages from the injected script ────────────────────────
window.addEventListener('message', async event => {
  if (event.source !== window) return;

  // If context is gone, stop listening — user needs to refresh the tab
  if (!isContextValid()) {
    showToast('⚡ Extension updated — please refresh this tab to re-activate sync', 'info');
    return;
  }

  if (event.data?.type === 'LEETCODE_INJECTOR_READY') {
    console.log('[LeetCode AI Sync] Interceptor ready ✓');
    return;
  }

  if (event.data?.type !== 'LEETCODE_SUBMISSION_ACCEPTED') return;

  const raw = event.data.payload;
  if (!raw?.submissionId) return;

  // Deduplicate — same submission can fire multiple times from different interceptors
  if (recentlyProcessed.has(raw.submissionId)) return;
  recentlyProcessed.add(raw.submissionId);
  setTimeout(() => recentlyProcessed.delete(raw.submissionId), 30000);

  showToast('🔍 LeetCode AI Sync: processing submission…', 'info');
  await processSubmission(raw);
});

const recentlyProcessed = new Set<string>();

// ─── Process a detected submission ───────────────────────────────────────
async function processSubmission(raw: Record<string, any>) {
  try {
    const slug = raw.titleSlug || extractSlugFromUrl();
    if (!slug) throw new Error('Could not determine problem slug from URL');

    // Fetch rich metadata via GraphQL
    const meta = await fetchGraphQLMetadata(slug);

    // Fallback code: try fetching submission detail if code not captured
    let code = raw.code ?? '';
    if (!code && raw.submissionId) {
      code = await fetchSubmissionCode(raw.submissionId);
    }

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
      code,
      runtime: raw.runtime ?? '',
      memory: raw.memory ?? '',
      url: `https://leetcode.com/problems/${slug}/`,
      timestamp: Date.now(),
      isSQL: isSQL(raw.language ?? ''),
    };

    if (!submission.code?.trim()) {
      console.warn('[LeetCode AI Sync] Code is empty — will retry from submission detail');
    }

    const sent = safeSendToBackground({
      type: 'SUBMISSION_DETECTED',
      payload: submission,
    });

    if (sent) {
      showToast('✅ LeetCode AI Sync: syncing to GitHub…', 'success');
    }
  } catch (err) {
    const msg = String(err);
    // Don't show scary red error for context-invalidated — it's expected after extension reload
    if (msg.includes('Extension context invalidated') || msg.includes('Cannot read properties of undefined')) {
      console.warn('[LeetCode AI Sync] Context invalidated — reload the LeetCode tab');
      showToast('⚡ Extension updated — please refresh this tab to re-activate sync', 'info');
      return;
    }
    console.error('[LeetCode AI Sync] Error processing submission:', err);
    showToast(`❌ LeetCode AI Sync: ${msg}`, 'error');
  }
}

// ─── Fetch submission code from LeetCode API (fallback) ──────────────────
async function fetchSubmissionCode(submissionId: string): Promise<string> {
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        code
        lang { name verboseName }
        statusDisplay
        runtime
        memory
      }
    }
  `;
  try {
    const res = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query,
        variables: { submissionId: parseInt(submissionId, 10) },
      }),
    });
    const data = await res.json();
    return data?.data?.submissionDetails?.code ?? '';
  } catch {
    return '';
  }
}

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
    .map(s => s.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

function parseExamples(testcases: string, html: string): Example[] {
  const examples: Example[] = [];

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

// ─── Inject "Sync Now" button on LeetCode (fallback) ─────────────────────
// Adds a small button in the top-right so users can manually trigger sync
// if auto-detection missed the submission.
function injectSyncButton() {
  if (document.getElementById('lc-ai-sync-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'lc-ai-sync-btn';
  btn.textContent = '⚡ Sync';
  btn.title = 'LeetCode AI Sync — manually trigger push to GitHub';
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    background: #3a52eb;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(58,82,235,0.4);
    transition: all 0.15s ease;
    font-family: Inter, system-ui, sans-serif;
  `;
  btn.onmouseover = () => { btn.style.background = '#2f3fd7'; btn.style.transform = 'translateY(-1px)'; };
  btn.onmouseout  = () => { btn.style.background = '#3a52eb'; btn.style.transform = 'translateY(0)'; };

  btn.onclick = async () => {
    const slug = extractSlugFromUrl();
    if (!slug) {
      showToast('❌ Navigate to a LeetCode problem first', 'error');
      return;
    }
    btn.textContent = '⏳ Syncing…';
    btn.disabled = true;

    // Synthesize a submission event with code from the editor
    const editorCode = getEditorCode();
    const lang = getEditorLang();

    await processSubmission({
      submissionId: `manual-${Date.now()}`,
      language: lang,
      code: editorCode,
      titleSlug: slug,
      runtime: 'N/A',
      memory: 'N/A',
    });

    btn.textContent = '⚡ Sync';
    btn.disabled = false;
  };

  document.body.appendChild(btn);
}

function getEditorCode(): string {
  // Monaco editor API
  try {
    const monaco = (window as any).monaco;
    if (monaco) {
      const editors = monaco.editor.getEditors?.() ?? [];
      if (editors.length > 0) return editors[0].getValue();
    }
  } catch {}
  // Fallback: CodeMirror
  try {
    const cm = (document.querySelector('.CodeMirror') as any)?.CodeMirror;
    if (cm) return cm.getValue();
  } catch {}
  return '';
}

function getEditorLang(): string {
  // Try to read language from LeetCode's UI
  const langBtns = document.querySelectorAll('[data-cy="lang-select"] button, [class*="langBtn"]');
  if (langBtns.length > 0) return (langBtns[0] as HTMLElement).textContent?.toLowerCase().trim() ?? 'java';
  return 'java';
}

// ─── Toast notification (Shadow DOM) ────────────────────────────────────
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const colors = { success: '#22c55e', error: '#ef4444', info: '#4f6ef7' };

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

// Inject button once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSyncButton);
} else {
  injectSyncButton();
}
