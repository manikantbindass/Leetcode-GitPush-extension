/**
 * injected.ts — Runs in LeetCode PAGE main world.
 * Three-layer detection:
 *   1. Intercept fetch/XHR network requests (primary)
 *   2. MutationObserver watching for "Accepted" verdict in DOM (fallback)
 *   3. Code always read from Monaco editor when available (most reliable)
 */
(function () {
  'use strict';

  const processedIds = new Set<string>();
  let lastSubmitCode = '';
  let lastSubmitLang = '';
  let lastSubmitSlug = '';

  // ─── Layer 3: Read code directly from Monaco editor ───────────────────────
  function readEditorCode(): string {
    try {
      // Monaco global API
      const monaco = (window as any).monaco;
      if (monaco?.editor) {
        const editors = monaco.editor.getEditors?.() ?? monaco.editor.getModels?.() ?? [];
        for (const e of editors) {
          const val = typeof e.getValue === 'function' ? e.getValue() : e.createSnapshot?.()?.read();
          if (val && val.trim()) return val;
        }
      }
    } catch {}
    try {
      // LeetCode stores editor in window._monaco or similar
      const lc = (window as any).__lcEditor ?? (window as any).__codeEditor;
      if (lc?.getValue) return lc.getValue();
    } catch {}
    return '';
  }

  function readEditorLang(): string {
    try {
      // LeetCode language selector
      const sel = document.querySelector('[data-cy="lang-select"] button') as HTMLElement;
      if (sel?.textContent) return sel.textContent.trim().toLowerCase();
      // Or from dropdown
      const active = document.querySelector('[class*="ant-select-selection-item"]') as HTMLElement;
      if (active?.textContent) return active.textContent.trim().toLowerCase();
    } catch {}
    return lastSubmitLang || 'java';
  }

  // ─── Layer 1: Fetch interceptor ───────────────────────────────────────────
  const originalFetch = window.fetch.bind(window);

  (window as any).fetch = async function (...args: Parameters<typeof fetch>) {
    const url = getUrl(args[0]);
    const options = args[1] as RequestInit | undefined;

    // Capture submit request body BEFORE the response
    if (isSubmitUrl(url) || (url.includes('graphql') && isSubmitBody(options?.body))) {
      captureSubmitBody(options?.body, url);
    }

    const response = await originalFetch(...args);

    // REST submit response → get submissionId and poll
    if (isSubmitUrl(url)) {
      response.clone().json().then((data: any) => {
        if (data?.submission_id) {
          pollSubmission(String(data.submission_id));
        }
      }).catch(() => {});
    }

    // Check endpoint
    if (url.includes('/submissions/detail/') && url.includes('/check')) {
      response.clone().json().then((data: any) => {
        if (data?.state === 'SUCCESS' && data?.status_msg === 'Accepted') {
          const id = url.match(/\/detail\/(\d+)\//)?.[1] ?? String(data.submission_id ?? '');
          handleAccepted(id || String(Date.now()), data);
        }
      }).catch(() => {});
    }

    // GraphQL responses
    if (url.includes('graphql')) {
      response.clone().json().then((data: any) => {
        // submitSolution mutation response
        const sub = findSubmissionId(data);
        if (sub) {
          pollSubmission(sub);
          // Also save slug from mutation body
          captureSubmitBody(options?.body, url);
        }
        // submissionDetails query response
        const detail = data?.data?.submissionDetails;
        if (detail?.code && (detail?.statusDisplay === 'Accepted' || detail?.status === 'Accepted')) {
          const id = String(detail.id ?? detail.submissionId ?? Date.now());
          if (!processedIds.has(id)) {
            lastSubmitCode = detail.code;
            lastSubmitLang = detail.lang?.name ?? lastSubmitLang;
            handleAccepted(id, {
              status_msg: 'Accepted',
              lang: detail.lang?.name ?? lastSubmitLang,
              code: detail.code,
              status_runtime: detail.runtimeDisplay ?? detail.runtime ?? '',
              status_memory: detail.memoryDisplay ?? detail.memory ?? '',
            });
          }
        }
      }).catch(() => {});
    }

    return response;
  };

  // ─── Layer 1: XHR interceptor ─────────────────────────────────────────────
  const OriginalOpen = XMLHttpRequest.prototype.open;
  const OriginalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _url?: string },
    method: string, url: string | URL, ...rest: any[]
  ) {
    this._url = typeof url === 'string' ? url : url.toString();
    return OriginalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _url?: string },
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    if (isSubmitUrl(this._url ?? '')) captureSubmitBody(body, this._url ?? '');

    this.addEventListener('load', () => {
      try {
        if (isSubmitUrl(this._url ?? '')) {
          const data = JSON.parse(this.responseText);
          if (data?.submission_id) pollSubmission(String(data.submission_id));
        }
        if (this._url?.includes('/submissions/detail/') && this._url?.includes('/check')) {
          const data = JSON.parse(this.responseText);
          if (data?.state === 'SUCCESS' && data?.status_msg === 'Accepted') {
            const id = this._url.match(/\/detail\/(\d+)\//)?.[1] ?? String(data.submission_id ?? '');
            handleAccepted(id || String(Date.now()), data);
          }
        }
      } catch {}
    });
    return OriginalSend.call(this, body);
  };

  // ─── Layer 2: DOM MutationObserver — watches for "Accepted" verdict ────────
  function startDomObserver() {
    let domTriggered = false;

    const observer = new MutationObserver(() => {
      if (domTriggered) return;

      // Look for the verdict element — various class patterns LeetCode uses
      const verdictSelectors = [
        '[data-e2e-locator="submission-result"]',
        '[class*="text-green"][class*="text-xl"]',
        '[class*="accepted"]',
      ];

      for (const sel of verdictSelectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el?.textContent?.toLowerCase().includes('accepted')) {
          domTriggered = true;
          setTimeout(() => { domTriggered = false; }, 5000); // reset after 5s

          const code = readEditorCode() || lastSubmitCode;
          const lang = readEditorLang() || lastSubmitLang;
          const slug = lastSubmitSlug || extractSlugFromUrl();
          const id = `dom-${Date.now()}`;

          if (!processedIds.has(id)) {
            handleAccepted(id, {
              status_msg: 'Accepted',
              lang,
              code,
              status_runtime: '',
              status_memory: '',
            });
          }
          break;
        }
      }
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  }

  startDomObserver();

  // ─── Polling ──────────────────────────────────────────────────────────────
  function pollSubmission(submissionId: string) {
    if (processedIds.has(submissionId)) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts++ > 25) { clearInterval(interval); return; }
      try {
        const res = await originalFetch(
          `https://leetcode.com/submissions/detail/${submissionId}/check/`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data?.state === 'SUCCESS') {
          clearInterval(interval);
          if (data?.status_msg === 'Accepted') {
            // code may be in data.code or we'll fetch it separately
            handleAccepted(submissionId, data);
          }
        }
      } catch {}
    }, 1500);
  }

  // ─── Core handler ─────────────────────────────────────────────────────────
  function handleAccepted(submissionId: string, data: any) {
    if (processedIds.has(submissionId)) return;
    processedIds.add(submissionId);

    // Priority: captured body > editor > data field > empty
    const code = lastSubmitCode || readEditorCode() || data?.code || data?.submission_code || '';
    const lang = normalizeLanguage(data?.lang ?? data?.pretty_lang ?? lastSubmitLang ?? readEditorLang() ?? '');
    const slug = lastSubmitSlug || extractSlugFromUrl();

    console.log('[LeetCode AI Sync] Accepted detected:', { submissionId, lang, codeLength: code.length, slug });

    window.postMessage({
      type: 'LEETCODE_SUBMISSION_ACCEPTED',
      payload: {
        submissionId,
        status: data?.status_msg ?? 'Accepted',
        runtime: data?.status_runtime ?? data?.runtime ?? '',
        memory: data?.status_memory ?? data?.memory ?? '',
        language: lang,
        code,
        titleSlug: slug,
        problemNumber: 0,
        title: '',
        difficulty: '',
        topics: [],
      },
    }, '*');
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.toString();
    return (input as Request).url;
  }

  function isSubmitUrl(url: string): boolean {
    return url.includes('/problems/') && url.includes('/submit/');
  }

  function captureSubmitBody(body: any, url: string) {
    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;
      if (!parsed) return;

      // REST submit: { typed_code, lang, question_id }
      if (parsed.typed_code) lastSubmitCode = parsed.typed_code;
      if (parsed.lang) lastSubmitLang = parsed.lang;

      // GraphQL submitSolution: { variables: { submitInput: { typedCode, lang, questionSlug } } }
      const si = parsed?.variables?.submitInput;
      if (si?.typedCode) lastSubmitCode = si.typedCode;
      if (si?.lang) lastSubmitLang = si.lang;
      if (si?.questionSlug) lastSubmitSlug = si.questionSlug;

      // Also check direct variables.typedCode
      if (parsed?.variables?.typedCode) lastSubmitCode = parsed.variables.typedCode;
      if (parsed?.variables?.lang) lastSubmitLang = parsed.variables.lang;
    } catch {}
  }

  function isSubmitBody(body: RequestInit['body']): boolean {
    if (typeof body !== 'string') return false;
    try {
      const p = JSON.parse(body);
      return !!(
        p?.variables?.submitInput?.typedCode ||
        p?.variables?.typedCode ||
        p?.typed_code
      );
    } catch { return false; }
  }

  function findSubmissionId(data: any): string | null {
    const id =
      data?.data?.submitSolution?.submissionId ??
      data?.data?.submit?.submissionId ??
      data?.data?.submitSolution?.id ??
      null;
    return id ? String(id) : null;
  }

  function extractSlugFromUrl(): string {
    const m = window.location.pathname.match(/\/problems\/([\w-]+)\//);
    return m?.[1] ?? '';
  }

  function normalizeLanguage(lang: string): string {
    const map: Record<string, string> = {
      python3: 'python3', python: 'python', java: 'java', cpp: 'cpp', c: 'c',
      csharp: 'csharp', javascript: 'javascript', typescript: 'typescript',
      php: 'php', swift: 'swift', kotlin: 'kotlin', dart: 'dart',
      golang: 'go', go: 'go', ruby: 'ruby', rust: 'rust',
      mysql: 'sql', mssql: 'sql', oraclesql: 'sql', postgresql: 'sql', pandas: 'pandas',
    };
    return map[lang.toLowerCase()] ?? lang.toLowerCase();
  }

  window.postMessage({ type: 'LEETCODE_INJECTOR_READY' }, '*');
  console.log('[LeetCode AI Sync] Injector loaded ✓');
})();
