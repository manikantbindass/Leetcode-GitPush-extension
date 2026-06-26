import type { Submission, QueueItem, OutputLanguage } from '@/types/submission';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { logout } from './oauth';
import { generateSolutions, testProvider } from './ai';
import { syncToGitHub, fetchAndCacheRepoTree, buildCommitMessage, getGitHubClient } from './github';
import { updateRepositoryReadme } from './readme';
import { findTopicDirectory, buildFilePath } from '@/lib/github/tree';
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

// ─── Alarm: process retry queue every 2 minutes ─────────────────────────────
chrome.alarms.create('processQueue', { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'processQueue') processQueue();
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
        if (autoPush !== false) {
          processItem(item).then(broadcastQueueUpdate).catch(console.error);
        }
        sendResponse({ ok: true });
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
async function enqueueSubmission(submission: Submission): Promise<QueueItem> {
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
    const [repo, branch, rawLangs, dryRun, style, topicMapping, commitTpl] =
      await Promise.all([
        storage.get('selectedRepo'),
        storage.get('selectedBranch'),
        storage.get('targetLanguages'),
        storage.get('dryRun'),
        storage.get('fileNamingStyle'),
        storage.get('topicMapping'),
        storage.get('commitTemplate'),
      ]);

    if (!repo || !branch) {
      throw new Error(
        'No repository configured. Open Settings → select your repo and branch first.'
      );
    }

    const { submission } = item;

    // Validate submission has required data
    if (!submission.code?.trim()) {
      throw new Error('Submission code is empty — the page interceptor may not have captured it. Try submitting again.');
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

    // 2. Get repo tree for folder placement
    let treeDirs: string[] = [];
    try {
      const CACHE_TTL = 30 * 60 * 1000; // 30 min
      const cachedAt = await storage.get('repoTreeFetchedAt');
      if (!cachedAt || Date.now() - cachedAt > CACHE_TTL) {
        treeDirs = await fetchAndCacheRepoTree(repo, branch);
      } else {
        treeDirs = (await storage.get('repoTree')) ?? [];
      }
    } catch {
      treeDirs = [];
    }

    // Reconstruct TreeItem array for findTopicDirectory
    const treeItems = treeDirs.map(p => ({
      path: p,
      type: 'tree' as const,
      sha: '',
      url: '',
    }));

    // Find best matching folder from repo structure
    const topicDir = findTopicDirectory(
      treeItems,
      submission.topics ?? [],
      topicMapping ?? {}
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

    // 4. Push to GitHub
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
