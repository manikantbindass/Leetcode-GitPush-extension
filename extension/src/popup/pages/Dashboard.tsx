import { useState } from 'react';
import { GitBranch, Zap, Flame, RefreshCw, Download, Activity } from 'lucide-react';
import { usePopupStore } from '../store';
import { timeAgo } from '@/lib/utils';
import { sendMessage } from '@/lib/messaging';

export function Dashboard() {
  const {
    solvedStats, recentSubmissions, selectedRepo, selectedBranch,
    activeProvider, providers, streak, lastSynced, queue, retryQueue,
  } = usePopupStore();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const pendingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;
  const failedCount  = queue.filter(i => i.status === 'failed').length;
  const doneCount    = queue.filter(i => i.status === 'done').length;
  const activeProviderConfig = providers.find(p => p.type === activeProvider);

  const handleSyncLast = async () => {
    setSyncing(true);
    setSyncMsg('Connecting to LeetCode…');
    try {
      const [tab] = await chrome.tabs.query({ url: 'https://leetcode.com/*' });
      if (!tab?.id) { setSyncMsg('❌ Open LeetCode first'); setSyncing(false); return; }
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          const meQ = `query { userStatus { username } }`;
          const meR = await fetch('https://leetcode.com/graphql/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: meQ }) });
          const me = await meR.json();
          const username = me?.data?.userStatus?.username;
          if (!username) return null;
          const acQ = `query($u:String!,$l:Int!){ recentAcSubmissionList(username:$u,limit:$l){ id titleSlug title timestamp lang } }`;
          const acR = await fetch('https://leetcode.com/graphql/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: acQ, variables: { u: username, l: 1 } }) });
          const acData = await acR.json();
          const sub = acData?.data?.recentAcSubmissionList?.[0];
          if (!sub) return null;
          const dQ = `query($id:Int!){ submissionDetails(submissionId:$id){ code runtime memory lang{ name } question{ questionId title difficulty topicTags{ name } } } }`;
          const dR = await fetch('https://leetcode.com/graphql/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ query: dQ, variables: { id: parseInt(sub.id, 10) } }) });
          const dData = await dR.json();
          const d = dData?.data?.submissionDetails;
          const q = d?.question;
          return { submissionId: sub.id, code: d?.code ?? '', language: d?.lang?.name ?? sub.lang, titleSlug: sub.titleSlug, title: q?.title ?? sub.title, difficulty: q?.difficulty ?? 'Medium', topics: (q?.topicTags ?? []).map((t: any) => t.name), problemNumber: parseInt(q?.questionId ?? '0', 10), runtime: d?.runtime ?? '', memory: d?.memory ?? '' };
        },
      });
      const p = results?.[0]?.result as any;
      if (!p) { setSyncMsg('❌ Log in to LeetCode first'); setSyncing(false); return; }
      setSyncMsg(`⚡ Found: ${p.title}`);
      await sendMessage({ type: 'SUBMISSION_DETECTED', payload: { id: `manual-${Date.now()}`, ...p, url: `https://leetcode.com/problems/${p.titleSlug}/`, timestamp: Date.now(), isSQL: false, constraints: [], examples: [], description: '' } });
      setSyncMsg('✅ Queued → check Queue tab');
    } catch (err) { setSyncMsg(`❌ ${String(err)}`); }
    setSyncing(false);
  };

  const stats = [
    { label: 'Easy',   value: solvedStats.easy,   color: 'neon-green',  neonClass: 'glass-neon-green',  textClass: 'neon-text-green',  orb: 'pool-orb-green' },
    { label: 'Medium', value: solvedStats.medium,  color: 'neon-orange', neonClass: 'glass-neon-purple', textClass: 'neon-text-orange', orb: 'pool-orb-orange' },
    { label: 'Hard',   value: solvedStats.hard,    color: 'neon-pink',   neonClass: 'glass-neon-pink',   textClass: 'neon-text-pink',   orb: 'pool-orb-pink' },
  ];

  return (
    <div className="p-3 space-y-3 animate-fade-in">

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ label, value, neonClass, textClass, orb }) => (
          <div key={label} className={`${neonClass} rounded-xl p-3 text-center relative overflow-hidden`} style={{ minHeight: 72 }}>
            {/* Liquidity pool orb */}
            <div className={`pool-orb ${orb}`} style={{ width: 60, height: 60, top: -10, left: -10 }} />
            <div className="relative z-10">
              <p className={`text-2xl font-bold font-display leading-none ${textClass}`}>{value}</p>
              <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-semibold">{label}</p>
            </div>
            {/* Cyber corners */}
            <span className="cyber-corner cyber-corner-tl" />
            <span className="cyber-corner cyber-corner-br" />
          </div>
        ))}
      </div>

      {/* ── Total + Streak ───────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Total solved — big glass card */}
        <div className="flex-1 glass rounded-xl p-3 relative overflow-hidden" style={{ borderColor: 'rgba(0,245,255,0.15)' }}>
          <div className="pool-orb pool-orb-cyan" style={{ width: 80, height: 80, top: -20, right: -20, animationDelay: '0s' }} />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 animate-glow-pulse"
                 style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
              <span className="text-base font-bold font-display neon-text-cyan">{solvedStats.total}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider">Total Solved</p>
              {lastSynced && <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(lastSynced)}</p>}
            </div>
          </div>
          <span className="cyber-corner cyber-corner-tl" />
          <span className="cyber-corner cyber-corner-br" />
        </div>

        {/* Streak */}
        <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 relative overflow-hidden"
             style={{ borderColor: 'rgba(255,149,0,0.2)' }}>
          <div className="pool-orb pool-orb-orange" style={{ width: 50, height: 50, top: -10, right: -10 }} />
          <Flame size={16} className="text-[#ff9500] shrink-0 relative z-10" style={{ filter: 'drop-shadow(0 0 6px #ff9500)' }} />
          <div className="relative z-10">
            <p className="text-sm font-bold neon-text-orange leading-none">{streak}</p>
            <p className="text-[10px] text-white/30">day streak</p>
          </div>
        </div>
      </div>

      {/* ── Queue status bar ─────────────────────────────────────── */}
      {(pendingCount > 0 || failedCount > 0 || doneCount > 0) && (
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2"
             style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <Activity size={11} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 4px var(--neon-cyan))' }} />
          <div className="flex gap-3 text-[10px] flex-1">
            {pendingCount > 0 && <span className="neon-text-cyan">{pendingCount} processing</span>}
            {doneCount   > 0 && <span className="neon-text-green">{doneCount} pushed</span>}
            {failedCount > 0 && <span className="neon-text-pink">{failedCount} failed</span>}
          </div>
          {failedCount > 0 && (
            <button onClick={retryQueue}
                    className="btn-cyber rounded-lg px-2 py-1 flex items-center gap-1">
              <RefreshCw size={9} />Retry
            </button>
          )}
        </div>
      )}

      {/* ── Repo + Provider status ───────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2"
             style={{ borderColor: 'rgba(0,245,255,0.1)' }}>
          <GitBranch size={11} className="text-white/30 shrink-0" />
          {selectedRepo ? (
            <>
              <span className="text-[11px] text-white/60 truncate flex-1 font-mono">{selectedRepo.full_name}</span>
              <span className="text-[10px] text-white/30 shrink-0 font-mono">{selectedBranch}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-neon-pulse"
                    style={{ background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)' }} />
            </>
          ) : (
            <span className="text-[11px] text-white/20">No repository selected</span>
          )}
        </div>

        <div className="glass rounded-xl px-3 py-2 flex items-center gap-2"
             style={{ borderColor: 'rgba(191,0,255,0.15)' }}>
          <Zap size={11} className="text-white/30 shrink-0" />
          {activeProviderConfig ? (
            <>
              <span className="text-[11px] text-white/60 flex-1">{activeProviderConfig.name}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-neon-pulse"
                    style={{ background: 'var(--neon-purple)', boxShadow: '0 0 6px var(--neon-purple)', animationDelay: '1s' }} />
            </>
          ) : (
            <span className="text-[11px] text-white/20">No AI provider configured</span>
          )}
        </div>
      </div>

      {/* ── Manual sync button ───────────────────────────────────── */}
      <div className="space-y-1.5">
        <button
          onClick={handleSyncLast}
          disabled={syncing}
          className="btn-cyber-solid w-full rounded-xl py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing
            ? <><span className="animate-spin inline-block w-3 h-3 border border-black/40 border-t-black rounded-full" />Fetching…</>
            : <><Download size={13} />SYNC LAST SUBMISSION</>
          }
        </button>
        {syncMsg && (
          <p className={`text-[10px] text-center font-mono ${syncMsg.startsWith('❌') ? 'neon-text-pink' : 'neon-text-cyan'}`}>
            {syncMsg}
          </p>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="divider-cyber" />

      {/* ── Recent submissions ───────────────────────────────────── */}
      <div>
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-2 neon-text-cyan" style={{ opacity: 0.6 }}>
          ◆ Recent
        </h3>
        {recentSubmissions.length === 0 ? (
          <div className="text-center py-6 text-white/20 text-[11px] font-mono">
            {'>'} Awaiting submission data…
          </div>
        ) : (
          <div className="space-y-1">
            {recentSubmissions.slice(0, 5).map(sub => {
              const qItem = queue.find(q => q.submission?.titleSlug === sub.titleSlug);
              const isPushed = qItem?.status === 'done';
              const isFailed = qItem?.status === 'failed';
              return (
                <div key={sub.id}
                     className="glass rounded-xl px-3 py-2 flex items-center gap-2 group transition-all hover:border-[rgba(0,245,255,0.2)]"
                     style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-[10px] font-mono text-white/20 w-8 shrink-0">#{sub.problemNumber}</span>
                  <span className="text-[11px] text-white/70 truncate flex-1 group-hover:text-white transition-colors">{sub.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    sub.difficulty === 'Easy' ? 'badge-easy' :
                    sub.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'
                  }`}>{sub.difficulty[0]}</span>
                  {isPushed && <span className="text-[9px] font-mono neon-text-green">✓ PUSHED</span>}
                  {isFailed && <span className="text-[9px] font-mono neon-text-pink">✗ FAIL</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
