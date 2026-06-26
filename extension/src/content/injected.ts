/**
 * injected.ts — Runs in the LeetCode PAGE's main world context.
 * Monkey-patches fetch + XHR to detect accepted submissions.
 * Also intercepts GraphQL for submission code retrieval.
 * Communicates back to content script via window.postMessage.
 *
 * NOTE: No Chrome extension APIs available here.
 */
(function () {
  'use strict';

  const processedIds = new Set<string>();

  // ─── Track the last submitted code from the submit request ───────────────
  let lastSubmitCode = '';
  let lastSubmitLang = '';

  // ─── Fetch interceptor ───────────────────────────────────────────────────
  const originalFetch = window.fetch.bind(window);

  (window as any).fetch = async function (...args: Parameters<typeof fetch>) {
    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL
        ? args[0].toString()
        : (args[0] as Request).url;

    const options = args[1] as RequestInit | undefined;

    // ── Intercept the SUBMIT request to capture code ──────────────────────
    if (
      (url.includes('/problems/') && url.includes('/submit/')) ||
      (url.includes('graphql') && isSubmitBody(options?.body))
    ) {
      try {
        const body = typeof options?.body === 'string'
          ? JSON.parse(options.body)
          : options?.body;
        if (body?.typed_code) lastSubmitCode = body.typed_code;
        if (body?.lang) lastSubmitLang = body.lang;
        // GraphQL submitSolution
        if (body?.variables?.typedCode) lastSubmitCode = body.variables.typedCode;
        if (body?.variables?.lang) lastSubmitLang = body.variables.lang;
      } catch {}
    }

    const response = await originalFetch(...args);

    // ── Intercept SUBMIT response (REST) — returns submissionId ──────────
    if (url.includes('/problems/') && url.includes('/submit/')) {
      response.clone().json().then((data: any) => {
        if (data?.submission_id) {
          // Poll for result
          pollSubmission(String(data.submission_id));
        }
      }).catch(() => {});
    }

    // ── Intercept CHECK response ──────────────────────────────────────────
    if (url.includes('/submissions/detail/') && url.includes('/check')) {
      response.clone().json().then((data: any) => {
        if (data?.state === 'SUCCESS' && data?.status_msg === 'Accepted') {
          const submissionId = url.match(/\/detail\/(\d+)\//)?.[1]
            ?? String(data.submission_id ?? Date.now());
          handleAccepted(submissionId, data);
        }
      }).catch(() => {});
    }

    // ── Intercept GraphQL responses for submission results ────────────────
    if (url.includes('graphql')) {
      response.clone().json().then((data: any) => {
        // submissionDetails query
        const detail = data?.data?.submissionDetails;
        if (detail?.statusDisplay === 'Accepted' || detail?.status === 'Accepted') {
          const id = String(detail.id ?? detail.submissionId ?? Date.now());
          if (!processedIds.has(id)) {
            handleAccepted(id, {
              status_msg: 'Accepted',
              lang: detail.lang ?? lastSubmitLang,
              code: detail.code ?? detail.typedCode ?? lastSubmitCode,
              status_runtime: detail.runtime ?? detail.runtimeDisplay ?? '',
              status_memory: detail.memory ?? detail.memoryDisplay ?? '',
              submission_id: id,
            });
          }
        }
        // submitSolution mutation response
        const submitResult = data?.data?.submitSolution ?? data?.data?.submit;
        if (submitResult?.submissionId || submitResult?.id) {
          const id = String(submitResult.submissionId ?? submitResult.id);
          pollSubmission(id);
        }
      }).catch(() => {});
    }

    return response;
  };

  // ─── XHR interceptor ─────────────────────────────────────────────────────
  const OriginalOpen = XMLHttpRequest.prototype.open;
  const OriginalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _url?: string },
    method: string,
    url: string | URL,
    ...rest: any[]
  ) {
    this._url = typeof url === 'string' ? url : url.toString();
    return OriginalOpen.apply(this, [method, url, ...rest] as any);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _url?: string },
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    // Capture submit code
    if (this._url?.includes('/submit/') || this._url?.includes('graphql')) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : null;
        if (parsed?.typed_code) lastSubmitCode = parsed.typed_code;
        if (parsed?.lang) lastSubmitLang = parsed.lang;
      } catch {}
    }

    this.addEventListener('load', () => {
      try {
        if (this._url?.includes('/submit/')) {
          const data = JSON.parse(this.responseText);
          if (data?.submission_id) pollSubmission(String(data.submission_id));
        }
        if (
          this._url?.includes('/submissions/detail/') &&
          this._url?.includes('/check')
        ) {
          const data = JSON.parse(this.responseText);
          if (data?.state === 'SUCCESS' && data?.status_msg === 'Accepted') {
            const id = this._url.match(/\/detail\/(\d+)\//)?.[1]
              ?? String(data.submission_id ?? Date.now());
            handleAccepted(id, data);
          }
        }
      } catch {}
    });
    return OriginalSend.call(this, body);
  };

  // ─── Polling fallback — fetch submission details after REST submit ────────
  function pollSubmission(submissionId: string) {
    if (processedIds.has(submissionId)) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      if (attempts++ > 20) { clearInterval(interval); return; } // 20 × 1.5s = 30s max
      try {
        const res = await originalFetch(
          `https://leetcode.com/submissions/detail/${submissionId}/check/`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data?.state === 'SUCCESS') {
          clearInterval(interval);
          if (data?.status_msg === 'Accepted') {
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

    const slug = extractSlugFromUrl();

    // Code comes from: intercepted submit body > data.code > data.submission_code
    const code = lastSubmitCode || data?.code || data?.submission_code || '';

    window.postMessage(
      {
        type: 'LEETCODE_SUBMISSION_ACCEPTED',
        payload: {
          submissionId,
          status: data?.status_msg ?? 'Accepted',
          runtime: data?.status_runtime ?? data?.runtime ?? '',
          memory: data?.status_memory ?? data?.memory ?? '',
          language: normalizeLanguage(
            data?.lang ?? data?.pretty_lang ?? lastSubmitLang ?? ''
          ),
          code,
          titleSlug: slug,
          // Metadata filled in by content/index.ts via GraphQL
          problemNumber: 0,
          title: '',
          difficulty: '',
          topics: [],
          content: '',
        },
      },
      '*'
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function extractSlugFromUrl(): string {
    const m = window.location.pathname.match(/\/problems\/([\w-]+)\//);
    return m?.[1] ?? '';
  }

  function isSubmitBody(body: RequestInit['body']): boolean {
    if (typeof body !== 'string') return false;
    try {
      const parsed = JSON.parse(body);
      return !!(parsed?.variables?.typedCode || parsed?.typed_code);
    } catch { return false; }
  }

  function normalizeLanguage(lang: string): string {
    const map: Record<string, string> = {
      python3: 'python3', python: 'python', java: 'java', cpp: 'cpp', c: 'c',
      csharp: 'csharp', javascript: 'javascript', typescript: 'typescript',
      php: 'php', swift: 'swift', kotlin: 'kotlin', dart: 'dart',
      golang: 'go', go: 'go', ruby: 'ruby', rust: 'rust',
      mysql: 'sql', mssql: 'sql', oraclesql: 'sql', postgresql: 'sql',
      pandas: 'pandas',
    };
    return map[lang.toLowerCase()] ?? lang.toLowerCase();
  }

  // Signal ready
  window.postMessage({ type: 'LEETCODE_INJECTOR_READY' }, '*');
})();
