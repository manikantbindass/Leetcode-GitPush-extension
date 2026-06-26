import { useState } from 'react';
import { Inbox, RotateCcw, Trash2, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import type { QueueItem } from '@/types/submission';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { timeAgo, getLanguageEmoji } from '@/lib/utils';
import { usePopupStore } from '../store';
import { sendMessage } from '@/lib/messaging';

export function Queue() {
  const { queue, retryQueue, clearQueue } = usePopupStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'done' | 'failed'>('all');
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
      <div className="px-3 pt-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Sync Queue</h2>
            {queue.length > 0 && <Badge variant="neutral">{queue.length}</Badge>}
          </div>
          {counts.failed > 0 && <Badge variant="error">{counts.failed} failed</Badge>}
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(counts) as Array<keyof typeof counts>).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                filter === f
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-surface-2 border-white/8 text-white/50 hover:text-white/80'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {counts[f] > 0 && <span className="ml-1 opacity-70">{counts[f]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox size={32} className="text-white/15 mb-3" />
            <p className="text-sm text-white/30">
              {filter === 'all' ? 'Queue is empty' : `No ${filter} items`}
            </p>
            <p className="text-xs text-white/20 mt-1">
              Accepted LeetCode submissions appear here
            </p>
          </div>
        ) : (
          filtered.map(item => <QueueCard key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      {queue.length > 0 && (
        <div className="px-3 pb-3 pt-2 border-t border-white/6 flex gap-2 shrink-0">
          {counts.failed > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={retrying}
              leftIcon={<RotateCcw size={12} />}
              onClick={handleRetryAll}
              className="flex-1"
            >
              Retry Failed ({counts.failed})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 size={12} />}
            onClick={clearQueue}
            className="flex-1"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Individual queue item card ───────────────────────────────────────────────
function QueueCard({ item }: { item: QueueItem }) {
  const [expanded, setExpanded] = useState(item.status === 'failed');
  const { submission } = item;
  const diff = (submission?.difficulty ?? 'Medium') as 'Easy' | 'Medium' | 'Hard';

  return (
    <div className={`bg-surface-2 border rounded-lg p-3 space-y-2 transition-colors ${
      item.status === 'failed' ? 'border-red-500/20' :
      item.status === 'done'   ? 'border-green-500/15' :
      item.status === 'processing' ? 'border-blue-500/20' :
      'border-white/8'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white/35 text-[10px] font-mono">
              #{submission?.problemNumber ?? '?'}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {submission?.title ?? 'Unknown Problem'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={diff.toLowerCase() as 'easy' | 'medium' | 'hard'}>{diff}</Badge>
            {submission?.language && (
              <span className="text-xs text-white/30">
                {getLanguageEmoji(submission.language)} {submission.language}
              </span>
            )}
            <span className="text-xs text-white/20">{timeAgo(item.createdAt)}</span>
            {item.attempts > 1 && (
              <span className="text-[10px] text-white/25">attempt {item.attempts}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StatusBadge status={item.status} />
          {item.status === 'processing' && (
            <Loader2 size={12} className="text-blue-400 animate-spin" />
          )}
        </div>
      </div>

      {/* Done — file list + commit link */}
      {item.status === 'done' && item.filesCreated?.length ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40">
              ✓ {item.filesCreated.length} files pushed
            </span>
            {item.repoUrl && (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                View commit <ExternalLink size={9} />
              </a>
            )}
          </div>
          {/* File paths */}
          <div className="space-y-0.5">
            {item.filesCreated.slice(0, 6).map(f => (
              <p key={f} className="text-[9px] font-mono text-white/25 truncate">
                📄 {f}
              </p>
            ))}
            {item.filesCreated.length > 6 && (
              <p className="text-[9px] text-white/20">+{item.filesCreated.length - 6} more</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Failed — show error */}
      {item.status === 'failed' && item.lastError && (
        <div className="space-y-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide' : 'Show'} error details
          </button>
          {expanded && (
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
              <p className="text-[10px] text-red-400/80 font-mono break-all leading-relaxed">
                {item.lastError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
