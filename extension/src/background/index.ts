import type { Submission, QueueItem, OutputLanguage } from '@/types/submission';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { startOAuth, logout } from './oauth';
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
    });
    // Open options page on first install
    chrome.runtime.openOptionsPage?.();
  }
});

// ─── Alarm: process retry queue every 2 minutes ────────────────────────────
chrome.alarms.create('processQueue', { periodInMinutes: 2 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'processQueue') processQueue();
});

// ─── Message router ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'SUBMISSION_DETECTED': {
        const submission: Submission = msg.payload;
        const item = await enqueueSubmission(submission);
        const autoPush = await storage.get('autoPush');
        broadcastQueueUpdate();
        if (autoPush !== false) {
          processItem(item).then(broadcastQueueUpdate);
        }
        sendResponse({ ok: true });
        break;
      }

      case 'AUTH_START':
        startOAuth();
        sendResponse({ ok: true });
        break;

      case 'AUTH_LOGOUT':
        await logout();
        sendResponse({ ok: true });
        break;

      case 'QUEUE_RETRY':
        processQueue().then(broadcastQueueUpdate);
        sendResponse({ ok: true });
        break;

      case 'QUEUE_CLEAR':
        await clearQueue();
        broadcastQueueUpdate();
        sendResponse({ ok: true });
        break;

      case 'FETCH_REPOS': {
        const gh = await getGitHubClient();
        if (!gh) { sendResponse({ error: 'Not authenticated' }); break; }
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
        if (!gh) { sendResponse({ error: 'Not authenticated' }); break; }
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
        const dirs = await fetchAndCacheRepoTree(selectedRepo, selectedBranch);
        sendResponse({ dirs });
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

// ─── Pipeline helpers ──────────────────────────────────────────────────────
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
  await updateQueueItem(item.id, { status: 'processing', attempts: item.attempts + 1 });

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
      throw new Error('No repository configured. Please select one in Settings.');
    }

    const { submission } = item;
    const langs: OutputLanguage[] = rawLangs?.length ? (rawLangs as OutputLanguage[]) : DEFAULT_LANGUAGES;
    const effectiveLangs = submission.isSQL ? ['sql', 'pandas'] as OutputLanguage[] : langs;

    // 1. Generate AI solutions
    const { solutions, complexity, explanation } = await generateSolutions(
      submission,
      effectiveLangs
    );

    // 2. Build files
    const gh = await getGitHubClient();
    let treeDirs: string[] = [];
    if (gh) {
      const CACHE_TTL = 30 * 60 * 1000; // 30 min
      const cachedAt = await storage.get('repoTreeFetchedAt');
      if (!cachedAt || Date.now() - cachedAt > CACHE_TTL) {
        treeDirs = await fetchAndCacheRepoTree(repo, branch);
      } else {
        treeDirs = (await storage.get('repoTree')) ?? [];
      }
    }

    // Reconstruct TreeItem array for findTopicDirectory
    const treeItems = treeDirs.map(p => ({ path: p, type: 'tree' as const, sha: '', url: '' }));
    const topicDir = findTopicDirectory(treeItems, submission.topics, topicMapping ?? {});

    const filesList: Array<{ path: string; content: string }> = [];
    for (const lang of effectiveLangs) {
      const code = solutions[lang];
      if (!code) continue;
      const filePath = buildFilePath(
        topicDir,
        submission.problemNumber,
        submission.title,
        lang,
        style ?? 'number-slug'
      );
      const content = buildSolutionFile(submission, lang, code, complexity, explanation);
      filesList.push({ path: filePath, content });
    }

    // 3. Push to GitHub
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

    if (!syncResult.success) throw new Error(syncResult.error ?? 'Sync failed');

    // 4. Update README
    if (gh && !dryRun) {
      await updateRepositoryReadme(gh, repo, branch, submission);
    }

    // 5. Update stats
    await updateStats(submission);

    // 6. Mark done
    await updateQueueItem(item.id, {
      status: 'done',
      filesCreated: syncResult.filesCreated,
      repoUrl: syncResult.commitUrl,
    });

    chrome.runtime.sendMessage({
      type: 'SYNC_COMPLETE',
      payload: {
        submissionId: item.id,
        repoUrl: syncResult.commitUrl ?? '',
        filesCreated: syncResult.filesCreated,
        commitSha: '',
      },
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'LeetCode AI Sync ✅',
      message: `${submission.title} synced! ${syncResult.filesCreated.length} files pushed.`,
    });
  } catch (err) {
    const errMsg = String(err);
    await updateQueueItem(item.id, { status: 'failed', lastError: errMsg });
    chrome.runtime.sendMessage({
      type: 'SYNC_ERROR',
      payload: { submissionId: item.id, error: errMsg },
    });
  }
}

async function updateStats(submission: Submission): Promise<void> {
  const stats = (await storage.get('solvedStats')) ?? { easy: 0, medium: 0, hard: 0, total: 0 };
  const key = submission.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
  stats[key]++;
  stats.total++;

  const recent = (await storage.get('recentSubmissions')) ?? [];
  const updated = [submission, ...recent.filter(s => s.id !== submission.id)].slice(0, 50);

  // Streak
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
}

async function broadcastQueueUpdate(): Promise<void> {
  const items = await getAllItems();
  try {
    chrome.runtime.sendMessage({ type: 'QUEUE_UPDATE', payload: items });
  } catch { /* popup may be closed */ }
}
