/**
 * injected.ts — Runs in the LeetCode PAGE's main world context.
 * Monkey-patches fetch + XHR to detect accepted submissions.
 * Communicates back to content script via window.postMessage.
 *
 * NOTE: No Chrome extension APIs available here.
 */
(function () {
  'use strict';

  const processedIds = new Set<string>();

  // ─── Fetch interceptor ───────────────────────────────────────────────────
  const originalFetch = window.fetch.bind(window);

  (window as any).fetch = async function (...args: Parameters<typeof fetch>) {
    const response = await originalFetch(...args);

    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof URL
        ? args[0].toString()
        : (args[0] as Request).url;

    // LeetCode submission check endpoint
    if (url.includes('/submissions/detail/') && url.includes('/check')) {
      const cloned = response.clone();
      cloned
        .json()
        .then((data: any) => {
          if (
            data?.state === 'SUCCESS' &&
            data?.status_msg === 'Accepted' &&
            data?.submission_id
          ) {
            handleAccepted(String(data.submission_id), data);
          }
        })
        .catch(() => {});
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
    this.addEventListener('load', () => {
      try {
        if (
          this._url?.includes('/submissions/detail/') &&
          this._url?.includes('/check')
        ) {
          const data = JSON.parse(this.responseText);
          if (
            data?.state === 'SUCCESS' &&
            data?.status_msg === 'Accepted' &&
            data?.submission_id
          ) {
            handleAccepted(String(data.submission_id), data);
          }
        }
      } catch {}
    });
    return OriginalSend.call(this, body);
  };

  // ─── Core handler ─────────────────────────────────────────────────────────
  function handleAccepted(submissionId: string, data: any) {
    if (processedIds.has(submissionId)) return;
    processedIds.add(submissionId);

    const slug = extractSlugFromUrl();
    const meta = extractMetaFromNextData(slug);

    window.postMessage(
      {
        type: 'LEETCODE_SUBMISSION_ACCEPTED',
        payload: {
          submissionId,
          status: data.status_msg,
          runtime: data.status_runtime ?? data.runtime ?? '',
          memory: data.status_memory ?? data.memory ?? '',
          language: normalizeLanguage(data.lang ?? data.pretty_lang ?? ''),
          code: data.code ?? data.submission_code ?? '',
          titleSlug: slug,
          // Metadata from next data (may be undefined)
          problemNumber: meta.questionId ? parseInt(meta.questionId, 10) : 0,
          title: meta.title ?? '',
          difficulty: meta.difficulty ?? '',
          topics: meta.topicTags?.map((t: any) => t.name) ?? [],
          content: meta.content ?? '',
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

  function extractMetaFromNextData(slug: string): any {
    try {
      const nextData = (window as any).__NEXT_DATA__;
      if (!nextData) return {};

      // Try dehydrated state queries
      const queries: any[] =
        nextData?.props?.pageProps?.dehydratedState?.queries ?? [];
      for (const q of queries) {
        const qd = q?.state?.data?.question;
        if (qd && (qd.titleSlug === slug || qd.title)) return qd;
      }

      // Try direct page props
      const question = nextData?.props?.pageProps?.question;
      if (question) return question;
    } catch {}
    return {};
  }

  function normalizeLanguage(lang: string): string {
    const map: Record<string, string> = {
      python3: 'python3',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      csharp: 'csharp',
      javascript: 'javascript',
      typescript: 'typescript',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
      dart: 'dart',
      golang: 'go',
      go: 'go',
      ruby: 'ruby',
      scala: 'scala',
      rust: 'rust',
      racket: 'racket',
      erlang: 'erlang',
      elixir: 'elixir',
      mysql: 'sql',
      mssql: 'sql',
      oraclesql: 'sql',
      postgresql: 'sql',
      pandas: 'pandas',
    };
    return map[lang.toLowerCase()] ?? lang.toLowerCase();
  }

  // Signal ready
  window.postMessage({ type: 'LEETCODE_INJECTOR_READY' }, '*');
})();
