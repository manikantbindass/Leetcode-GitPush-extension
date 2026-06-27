import type { Submission, QueueItem, OutputLanguage } from '@/types/submission';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { logout } from './oauth';
import { generateSolutions, testProvider } from './ai';
import { syncToGitHub, fetchAndCacheRepoTree, buildCommitMessage, getGitHubClient, checkFilesExistInRepo } from './github';
import { updateRepositoryReadme } from './readme';
import { buildFilePath } from '@/lib/github/tree';
import { determineFolderWithAI } from '@/lib/github/folder';
import { buildSolutionFile } from '@/lib/templates/file';
import {
  addToQueue,
  getPendingItems,
  updateQueueItem,
  clearQueue,
  getAllItems,
} from './queue';
import { DEFAULT_PROVIDERS } from '@/lib/ai/index';

const DEFAULT_LANGUAGES: OutputLanguage[] = [
  'java', 'python', 'javascript', 'cpp', 'go', 'typescript',
];

// ─── Extension install / update ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await storage.setMany({
      providers: DEFAULT_PROVIDERS,
      targetLanguages: DEFAULT_LANGUAGES,
      autoPush: true,
      dryRun: false,
      fileNamingStyle: 'number-slug',
      commitTemplate: 'feat: add {title} (#{number})',
      oauthServerUrl: 'http://localhost:3001',
      solvedStats: { easy: 0, medium: 0, hard: 0, total: 0 },
      recentSubmissions: [],
      streak: 0,
      topicMapping: {},
    });
    chrome.runtime.openOptionsPage?.();
  }
});

// ─── Alarms ─────────────────────────────────────────────────────────────────
chrome.alarms.create('processQueue',   { periodInMinutes: 1 });
chrome.alarms.create('pollLeetCode',   { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'processQueue') processQueue();
  if (alarm.name === 'pollLeetCode')  pollLeetCodeForNewSubmissions();
});

// ─── Message router ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'SUBMISSION_DETECTED': {
        const submission: Submission = msg.payload;
        const item = await enqueueSubmission(submission);
        const autoPush = await storage.get('autoPush');
        broadcastQueueUpdate();
        if (item && autoPush !== false) {
          processItem(item).then(broadcastQueueUpdate).catch(console.error);
        }
        sendResponse({ ok: item ? { ok: true } : { ok: false, reason: 'duplicate' } });
        break;
      }

      case 'AUTH_START':
        // Legacy OAuth start — now handled directly in popup via PAT
        sendResponse({ ok: true });
        break;

      case 'AUTH_LOGOUT':
        await logout();
        sendResponse({ ok: true });
        break;

      case 'QUEUE_RETRY':
        processQueue().then(broadcastQueueUpdate).catch(console.error);
        sendResponse({ ok: true });
        break;

      case 'QUEUE_CLEAR':
        await clearQueue();
        broadcastQueueUpdate();
        sendResponse({ ok: true });
        break;

      case 'FETCH_REPOS': {
        const gh = await getGitHubClient();
        if (!gh) { sendResponse({ error: 'Not authenticated with GitHub' }); break; }
        try {
          const repos = await gh.listRepositories();
          sendResponse({ repos });
        } catch (err) {
          sendResponse({ error: String(err) });
        }
        break;
      }

      case 'FETCH_BRANCHES': {
        const { owner, repo } = msg.payload as { owner: string; repo: string };
        const gh = await getGitHubClient();
        if (!gh) { sendResponse({ error: 'Not authenticated with GitHub' }); break; }
        try {
          const branches = await gh.listBranches(owner, repo);
          sendResponse({ branches });
        } catch (err) {
          sendResponse({ error: String(err) });
        }
        break;
      }

      case 'FETCH_TREE': {
        const selectedRepo = await storage.get('selectedRepo');
        const selectedBranch = await storage.get('selectedBranch');
        if (!selectedRepo || !selectedBranch) {
          sendResponse({ dirs: [] }); break;
        }
        try {
          const dirs = await fetchAndCacheRepoTree(selectedRepo, selectedBranch);
          sendResponse({ dirs });
        } catch {
          sendResponse({ dirs: [] });
        }
        break;
      }

      case 'TEST_PROVIDER': {
        const result = await testProvider(msg.payload);
        sendResponse(result);
        break;
      }

      default:
        sendResponse({ ok: false, error: `Unknown message type: ${msg.type}` });
    }
  })();
  return true; // keep channel open for async
});

// ─── Pipeline helpers ────────────────────────────────────────────────────────
async function enqueueSubmission(submission: Submission): Promise<QueueItem | null> {
  // ── Dedup check 1: already in queue (done or skipped) for this problem ──────
  const allItems = await getAllItems();
  const alreadyProcessed = allItems.find(
    q =>
      q.submission?.titleSlug === submission.titleSlug &&
      (q.status === 'done' || q.status === 'skipped')
  );
  if (alreadyProcessed) {
    console.log(
      `[LeetCode AI Sync] Skipping duplicate enqueue for "${submission.title}" — already ${alreadyProcessed.status}`
    );
    return null; // caller must handle null
  }

  // ── Dedup check 2: already queued (pending/processing) within last 5 min ────
  const recentPending = allItems.find(
    q =>
      q.submission?.titleSlug === submission.titleSlug &&
      (q.status === 'pending' || q.status === 'processing') &&
      Date.now() - q.createdAt < 5 * 60 * 1000
  );
  if (recentPending) {
    console.log(
      `[LeetCode AI Sync] Skipping duplicate enqueue for "${submission.title}" — already pending`
    );
    return null;
  }

  const item: QueueItem = {
    id: generateId(),
    submission,
    status: 'pending',
    attempts: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await addToQueue(item);
  return item;
}

async function processQueue(): Promise<void> {
  const pending = await getPendingItems();
  for (const item of pending) {
    await processItem(item);
  }
}


async function processItem(item: QueueItem): Promise<void> {
  await updateQueueItem(item.id, {
    status: 'processing',
    attempts: item.attempts + 1,
    updatedAt: Date.now(),
  });

  try {
    const [repo, branch, rawLangs, dryRun, style, commitTpl, customInstructions] =
      await Promise.all([
        storage.get('selectedRepo'),
        storage.get('selectedBranch'),
        storage.get('targetLanguages'),
        storage.get('dryRun'),
        storage.get('fileNamingStyle'),
        storage.get('commitTemplate'),
        storage.get('customInstructions'),
      ]);

    if (!repo || !branch) {
      throw new Error(
        'No repository configured. Open Settings → select your repo and branch first.'
      );
    }

    const { submission } = item;

    // If code is missing, try to fetch it from LeetCode submissionDetails API
    if (!submission.code?.trim() && submission.titleSlug) {
      console.log('[LeetCode AI Sync] Code empty — fetching from LeetCode API...');
      const fetched = await fetchCodeFromLeetCode(submission);
      if (fetched) {
        submission.code = fetched;
      } else {
        throw new Error(
          'Could not retrieve submission code. Open LeetCode in a tab and ensure you are logged in, then retry.'
        );
      }
    }

    // Determine languages to generate
    const langs: OutputLanguage[] = (rawLangs?.length
      ? rawLangs
      : DEFAULT_LANGUAGES) as OutputLanguage[];

    // SQL problems use only SQL/pandas
    const effectiveLangs: OutputLanguage[] = submission.isSQL
      ? ['sql', 'pandas'] as OutputLanguage[]
      : langs;

    // 1. Generate AI solutions
    const { solutions, complexity, explanation } = await generateSolutions(
      submission,
      effectiveLangs
    );

    // Validate at least one solution was returned
    const generatedLangs = Object.keys(solutions).filter(k => solutions[k]?.trim());
    if (generatedLangs.length === 0) {
      throw new Error('AI returned no solutions. Check your API key and model in Settings.');
    }

    // 2. Get repo tree — always refresh so we see current folder structure
    let existingFolders: string[] = [];
    try {
      const CACHE_TTL = 15 * 60 * 1000; // 15 min
      const cachedAt = await storage.get('repoTreeFetchedAt');
      if (!cachedAt || Date.now() - cachedAt > CACHE_TTL) {
        await fetchAndCacheRepoTree(repo, branch);
      }
      const storedItems = (await storage.get('repoTreeItems')) ?? [];
      // Extract top-level folder names only
      existingFolders = storedItems
        .filter(t => t.type === 'tree')
        .map(t => t.path);
    } catch {
      existingFolders = [];
    }

    // 3. AI determines the correct folder from your repo structure
    const topicDir = await determineFolderWithAI(
      submission,
      existingFolders,
      customInstructions ?? undefined
    );

    // 3. Build file list
    const filesList: Array<{ path: string; content: string }> = [];
    for (const lang of effectiveLangs) {
      const code = solutions[lang];
      if (!code?.trim()) continue; // Skip if AI didn't generate this language
      const filePath = buildFilePath(
        topicDir,
        submission.problemNumber || 0,
        submission.title || 'unknown',
        lang,
        style ?? 'number-slug'
      );
      const content = buildSolutionFile(
        submission,
        lang,
        code,
        complexity,
        explanation
      );
      filesList.push({ path: filePath, content });
    }

    if (filesList.length === 0) {
      throw new Error(
        `No files built. AI generated: [${Object.keys(solutions).join(', ')}] but selected languages are [${effectiveLangs.join(', ')}]. Check language settings.`
      );
    }

    // 4. Check if ALL files already exist in GitHub → skip instead of re-pushing
    if (!(dryRun ?? false)) {
      const existingPaths = await checkFilesExistInRepo(
        repo,
        branch,
        filesList.map(f => f.path)
      );
      if (existingPaths.length === filesList.length) {
        // Every target file is already on GitHub — nothing to commit
        const skipMsg = `Already in GitHub: ${existingPaths[0]} (+${existingPaths.length - 1} more)`;
        console.log('[LeetCode AI Sync] All files already exist →', skipMsg);

        await updateQueueItem(item.id, {
          status: 'skipped',
          skipReason: `✓ Already pushed — all ${existingPaths.length} file(s) exist in ${repo.name}`,
          filesCreated: existingPaths,
          updatedAt: Date.now(),
        });

        safeSendMessage({
          type: 'SYNC_SKIPPED',
          payload: { submissionId: item.id, reason: skipMsg },
        });

        chrome.notifications.create(`skip-${item.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'LeetCode AI Sync ⚡',
          message: `"${submission.title}" already in your repo — skipped.`,
        });
        return; // done — no commit
      } else if (existingPaths.length > 0) {
        // Some files exist, some don't — only push the missing ones
        const missingFiles = filesList.filter(f => !existingPaths.includes(f.path));
        console.log(
          `[LeetCode AI Sync] Partial — ${existingPaths.length} exist, pushing ${missingFiles.length} new files`
        );
        filesList.length = 0;
        filesList.push(...missingFiles);
      }
    }

    // 5. Push to GitHub
    const commitMsg = buildCommitMessage(
      commitTpl ?? 'feat: add {title} (#{number})',
      submission
    );

    const syncResult = await syncToGitHub({
      submission,
      files: filesList,
      commitMessage: commitMsg,
      repo,
      branch,
      dryRun: dryRun ?? false,
    });

    if (!syncResult.success) {
      throw new Error(syncResult.error ?? 'GitHub sync failed — check your token permissions (needs repo scope)');
    }

    // 5. Update README (non-critical)
    try {
      const gh = await getGitHubClient();
      if (gh && !(dryRun ?? false)) {
        await updateRepositoryReadme(gh, repo, branch, submission);
      }
    } catch (readmeErr) {
      console.warn('[LeetCode AI Sync] README update failed (non-critical):', readmeErr);
    }

    // 6. Update solved stats
    await updateStats(submission);

    // 7. Mark done
    await updateQueueItem(item.id, {
      status: 'done',
      filesCreated: syncResult.filesCreated,
      repoUrl: syncResult.commitUrl,
      updatedAt: Date.now(),
    });

    // Notify popup
    safeSendMessage({
      type: 'SYNC_COMPLETE',
      payload: {
        submissionId: item.id,
        repoUrl: syncResult.commitUrl ?? '',
        filesCreated: syncResult.filesCreated,
      },
    });

    // Chrome notification
    chrome.notifications.create(`sync-${item.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'LeetCode AI Sync ✅',
      message: `${submission.title} pushed! ${syncResult.filesCreated.length} files in ${repo.name}.`,
    });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[LeetCode AI Sync] processItem failed:', errMsg);

    await updateQueueItem(item.id, {
      status: 'failed',
      lastError: errMsg,
      updatedAt: Date.now(),
    });

    safeSendMessage({
      type: 'SYNC_ERROR',
      payload: { submissionId: item.id, error: errMsg },
    });
  }
}

// ─── Stats update ─────────────────────────────────────────────────────────────
async function updateStats(submission: Submission): Promise<void> {
  try {
    const stats = (await storage.get('solvedStats')) ?? { easy: 0, medium: 0, hard: 0, total: 0 };
    const key = (submission.difficulty?.toLowerCase() ?? 'easy') as 'easy' | 'medium' | 'hard';
    if (key in stats) stats[key]++;
    stats.total++;

    const recent = (await storage.get('recentSubmissions')) ?? [];
    const updated = [submission, ...recent.filter(s => s.id !== submission.id)].slice(0, 50);

    // Streak calculation
    const today = new Date().toDateString();
    const lastDate = await storage.get('lastSolvedDate');
    let streak = (await storage.get('streak')) ?? 0;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = lastDate === yesterday ? streak + 1 : 1;
    }

    await storage.setMany({
      solvedStats: stats,
      recentSubmissions: updated,
      lastSynced: Date.now(),
      lastSolvedDate: today,
      streak,
    });
  } catch (err) {
    console.warn('[LeetCode AI Sync] updateStats failed:', err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function broadcastQueueUpdate(): Promise<void> {
  const items = await getAllItems();
  safeSendMessage({ type: 'QUEUE_UPDATE', payload: items });
}

function safeSendMessage(msg: object): void {
  try {
    chrome.runtime.sendMessage(msg);
  } catch { /* popup may be closed — ignore */ }
}

// ─── Fetch submission code from LeetCode via scripting ────────────────────────
// Used when the interceptor captured the submission but missed the code body.
async function fetchCodeFromLeetCode(submission: Submission): Promise<string> {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    if (!tabs.length || !tabs[0].id) return '';

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: async (titleSlug: string) => {
        // Try submissionDetails by recent AC list
        const meQ = `query { userStatus { username } }`;
        const meR = await fetch('https://leetcode.com/graphql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: meQ }),
        });
        const me = await meR.json();
        const username = me?.data?.userStatus?.username;
        if (!username) return '';

        const acQ = `query($u:String!,$l:Int!){ recentAcSubmissionList(username:$u,limit:$l){ id titleSlug } }`;
        const acR = await fetch('https://leetcode.com/graphql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: acQ, variables: { u: username, l: 5 } }),
        });
        const acData = await acR.json();
        const match = (acData?.data?.recentAcSubmissionList ?? []).find(
          (s: any) => s.titleSlug === titleSlug
        );
        if (!match) return '';

        const dQ = `query($id:Int!){ submissionDetails(submissionId:$id){ code } }`;
        const dR = await fetch('https://leetcode.com/graphql/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query: dQ, variables: { id: parseInt(match.id, 10) } }),
        });
        const dData = await dR.json();
        return dData?.data?.submissionDetails?.code ?? '';
      },
      args: [submission.titleSlug],
    });
    return (results?.[0]?.result as string) ?? '';
  } catch (err) {
    console.warn('[LeetCode AI Sync] fetchCodeFromLeetCode failed:', err);
    return '';
  }
}

// ─── Polling: check LeetCode for new AC submissions every 2 min ───────────────
// This is the backup auto-detection path — runs even if the content script
// interceptor missed the submission event.
const _syncedSubmissionIds = new Set<string>();

async function pollLeetCodeForNewSubmissions(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
    if (!tabs.length || !tabs[0].id) return; // LeetCode not open

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: async () => {
        try {
          const meQ = `query { userStatus { username } }`;
          const meR = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ query: meQ }),
          });
          const me = await meR.json();
          const username = me?.data?.userStatus?.username;
          if (!username) return null;

          const acQ = `query($u:String!,$l:Int!){ recentAcSubmissionList(username:$u,limit:$l){ id titleSlug title timestamp lang } }`;
          const acR = await fetch('https://leetcode.com/graphql/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ query: acQ, variables: { u: username, l: 3 } }),
          });
          const acData = await acR.json();
          return acData?.data?.recentAcSubmissionList ?? null;
        } catch { return null; }
      },
      args: [],
    });

    const submissions: Array<{ id: string; titleSlug: string; title: string; timestamp: string; lang: string }> =
      results?.[0]?.result ?? [];
    if (!submissions?.length) return;

    const alreadySyncedIds: string[] = (await storage.get('syncedSubmissionIds') as string[]) ?? [];
    const syncedSet = new Set([...alreadySyncedIds, ..._syncedSubmissionIds]);

    // Process only submissions from the last 10 minutes that haven't been synced
    const tenMinAgo = Date.now() - 10 * 60 * 1000;

    for (const sub of submissions) {
      const ts = parseInt(sub.timestamp, 10) * 1000; // LeetCode uses seconds
      if (syncedSet.has(sub.id)) continue;
      if (ts < tenMinAgo) continue; // skip old ones

      _syncedSubmissionIds.add(sub.id);
      console.log('[LeetCode AI Sync] Polling found new AC submission:', sub.titleSlug);

      // Enqueue as a submission with empty code — processItem will fetch it
      const submission: Submission = {
        id: generateId(),
        problemNumber: 0,
        title: sub.title,
        titleSlug: sub.titleSlug,
        difficulty: 'Medium',
        topics: [],
        constraints: [],
        examples: [],
        description: '',
        language: sub.lang as any,
        code: '', // will be fetched by processItem
        runtime: '',
        memory: '',
        url: `https://leetcode.com/problems/${sub.titleSlug}/`,
        timestamp: ts,
        isSQL: ['mysql', 'mssql', 'oraclesql', 'postgresql', 'pandas'].includes(
          sub.lang.toLowerCase()
        ),
      };

      const existing = await getAllItems();
      const alreadyQueued = existing.some(
        q => q.submission?.titleSlug === sub.titleSlug &&
             Math.abs((q.submission?.timestamp ?? 0) - ts) < 60000
      );
      if (alreadyQueued) continue;

      const queued = await enqueueSubmission(submission);
      if (!queued) continue; // deduped — already processed
      // Persist synced ID so we don't re-queue after restart
      const freshIds: string[] = (await storage.get('syncedSubmissionIds') as string[]) ?? [];
      await storage.setMany({ syncedSubmissionIds: [...new Set([...freshIds, sub.id])] });
    }

    await processQueue();
  } catch (err) {
    console.warn('[LeetCode AI Sync] pollLeetCodeForNewSubmissions failed:', err);
  }
}

