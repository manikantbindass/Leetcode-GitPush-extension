import { useState } from 'react';
import { Inbox, RotateCcw, Trash2, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import type { QueueItem } from '@/types/submission';
import { timeAgo, getLanguageEmoji } from '@/lib/utils';
import { usePopupStore } from '../store';
import { sendMessage } from '@/lib/messaging';

const FILTER_LABELS: Record<string, string> = {
  all: 'ALL', pending: 'PENDING', processing: 'LIVE', done: 'DONE', failed: 'FAILED',
};
const FILTER_COLOR: Record<string, string> = {
  all: 'var(--neon-cyan)', pending: 'rgba(255,255,255,0.4)', processing: 'var(--neon-purple)',
  done: 'var(--neon-green)', failed: 'var(--neon-pink)',
};

export function Queue() {
  const { queue, retryQueue, clearQueue } = usePopupStore();
  const [filter, setFilter] = useState<'all'|'pending'|'processing'|'done'|'failed'>('all');
  const [retrying, setRetrying] = useState(false);

  const filtered = filter === 'all' ? queue : queue.filter(i => i.status === filter);
  const counts = {
    all: queue.length,
    pending: queue.filter(i => i.status === 'pending').length,
    processing: queue.filter(i => i.status === 'processing').length,
    done: queue.filter(i => i.status === 'done').length,
    failed: queue.filter(i => i.status === 'failed').length,
  };

  const handleRetryAll = async () => {
    setRetrying(true);
    await sendMessage({ type: 'QUEUE_RETRY' });
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-display font-bold neon-text-cyan tracking-widest uppercase">
              ◆ Sync Queue
            </h2>
            {queue.length > 0 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background:'rgba(0,245,255,0.1)', border:'1px solid rgba(0,245,255,0.25)', color:'var(--neon-cyan)' }}>
                {queue.length}
              </span>
            )}
          </div>
          {counts.failed > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded animate-neon-pulse"
                  style={{ background:'rgba(255,0,110,0.1)', border:'1px solid rgba(255,0,110,0.3)', color:'var(--neon-pink)' }}>
              {counts.failed} FAILED
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(counts) as Array<keyof typeof counts>).map(f => {
            const isActive = filter === f;
            const color = FILTER_COLOR[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                      className="text-[9px] font-mono font-semibold px-2 py-1 rounded-lg transition-all"
                      style={{
                        background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
                        color: isActive ? color : 'rgba(255,255,255,0.3)',
                        boxShadow: isActive ? `0 0 8px ${color}30` : 'none',
                      }}>
                {FILTER_LABELS[f]}{counts[f] > 0 && <span className="ml-1 opacity-60">{counts[f]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                 style={{ background:'rgba(0,245,255,0.05)', border:'1px solid rgba(0,245,255,0.15)' }}>
              <Inbox size={20} style={{ color:'rgba(0,245,255,0.3)' }} />
            </div>
            <p className="text-[11px] font-mono text-white/20">
              {filter === 'all' ? '// queue is empty' : `// no ${filter} items`}
            </p>
            <p className="text-[10px] text-white/15 font-mono mt-1">
              solve a LeetCode problem to start
            </p>
          </div>
        ) : (
          filtered.map(item => <QueueCard key={item.id} item={item} />)
        )}
      </div>

      {/* Footer actions */}
      {queue.length > 0 && (
        <div className="px-3 pb-3 pt-2 flex gap-2 shrink-0"
             style={{ borderTop:'1px solid rgba(0,245,255,0.06)' }}>
          {counts.failed > 0 && (
            <button onClick={handleRetryAll} disabled={retrying}
                    className="flex-1 btn-cyber rounded-xl py-2 flex items-center justify-center gap-1.5 disabled:opacity-40">
              {retrying
                ? <><span className="animate-spin w-2.5 h-2.5 border border-current/30 border-t-current rounded-full" />RETRYING…</>
                : <><RotateCcw size={11} />RETRY ({counts.failed})</>
              }
            </button>
          )}
          <button onClick={clearQueue}
                  className="flex-1 rounded-xl py-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase transition-all"
                  style={{ background:'rgba(255,0,110,0.05)', border:'1px solid rgba(255,0,110,0.2)', color:'rgba(255,0,110,0.7)' }}>
            <Trash2 size={11} />CLEAR ALL
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Queue item card ──────────────────────────────────────────────────────────
function QueueCard({ item }: { item: QueueItem }) {
  const [expanded, setExpanded] = useState(item.status === 'failed');
  const { submission } = item;
  const diff = (submission?.difficulty ?? 'Medium') as 'Easy'|'Medium'|'Hard';

  const statusConfig = {
    pending:    { color:'rgba(255,255,255,0.4)', label:'PENDING',    glow:'none' },
    processing: { color:'var(--neon-purple)',    label:'PROCESSING', glow:'0 0 8px rgba(191,0,255,0.5)' },
    done:       { color:'var(--neon-green)',     label:'PUSHED ✓',  glow:'0 0 8px rgba(57,255,20,0.5)' },
    failed:     { color:'var(--neon-pink)',      label:'FAILED ✗',  glow:'0 0 8px rgba(255,0,110,0.5)' },
  }[item.status] ?? { color:'rgba(255,255,255,0.4)', label:'UNKNOWN', glow:'none' };

  const borderColor = {
    failed: 'rgba(255,0,110,0.2)', done: 'rgba(57,255,20,0.15)',
    processing: 'rgba(191,0,255,0.2)', pending: 'rgba(255,255,255,0.06)',
  }[item.status];

  return (
    <div className="glass rounded-xl p-3 space-y-2 transition-all relative overflow-hidden"
         style={{ borderColor }}>
      {/* Small pool orb */}
      {item.status === 'processing' && (
        <div className="pool-orb pool-orb-purple" style={{ width:60, height:60, top:-20, right:-10 }} />
      )}
      {item.status === 'done' && (
        <div className="pool-orb pool-orb-green" style={{ width:60, height:60, top:-20, right:-10 }} />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-white/25">#{submission?.problemNumber ?? '?'}</span>
            <span className="text-[12px] font-semibold text-white truncate">{submission?.title ?? 'Unknown Problem'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              diff === 'Easy' ? 'badge-easy' : diff === 'Hard' ? 'badge-hard' : 'badge-medium'
            }`}>{diff}</span>
            {submission?.language && (
              <span className="text-[10px] text-white/25 font-mono">
                {getLanguageEmoji(submission.language)} {submission.language}
              </span>
            )}
            <span className="text-[9px] text-white/20 font-mono">{timeAgo(item.createdAt)}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ color: statusConfig.color, background:`${statusConfig.color}15`, border:`1px solid ${statusConfig.color}40`, boxShadow: statusConfig.glow }}>
            {statusConfig.label}
          </span>
          {item.status === 'processing' && (
            <Loader2 size={11} className="animate-spin" style={{ color:'var(--neon-purple)' }} />
          )}
        </div>
      </div>

      {/* Done — file list */}
      {item.status === 'done' && item.filesCreated?.length ? (
        <div className="space-y-1 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono" style={{ color:'var(--neon-green)' }}>
              ✓ {item.filesCreated.length} files pushed
            </span>
            {item.repoUrl && (
              <a href={item.repoUrl} target="_blank" rel="noreferrer"
                 className="text-[9px] font-mono flex items-center gap-1 transition-colors neon-text-cyan">
                View <ExternalLink size={8} />
              </a>
            )}
          </div>
          <div className="space-y-0.5 pl-1"
               style={{ borderLeft:'2px solid rgba(57,255,20,0.2)' }}>
            {item.filesCreated.slice(0, 5).map(f => (
              <p key={f} className="text-[8px] font-mono text-white/25 truncate">▸ {f}</p>
            ))}
            {item.filesCreated.length > 5 && (
              <p className="text-[8px] font-mono text-white/15">+{item.filesCreated.length - 5} more</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Failed — error */}
      {item.status === 'failed' && item.lastError && (
        <div className="space-y-1.5 relative z-10">
          <button onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 text-[9px] font-mono transition-colors"
                  style={{ color:'rgba(255,0,110,0.6)' }}>
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {expanded ? 'Hide' : 'Show'} error
          </button>
          {expanded && (
            <div className="rounded-lg p-2"
                 style={{ background:'rgba(255,0,110,0.05)', border:'1px solid rgba(255,0,110,0.15)' }}>
              <p className="text-[9px] font-mono break-all leading-relaxed" style={{ color:'rgba(255,0,110,0.8)' }}>
                {item.lastError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
