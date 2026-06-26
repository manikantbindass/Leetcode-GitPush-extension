import { useState } from 'react';
import { Inbox, RotateCcw, Trash2 } from 'lucide-react';
import { usePopupStore } from '../store';
import { QueueItemCard } from '@/components/QueueItem';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { QueueItem } from '@/types/submission';
import { sendMessage } from '@/lib/messaging';

type Filter = 'all' | 'pending' | 'processing' | 'done' | 'failed';

export function Queue() {
  const { queue, retryQueue, clearQueue } = usePopupStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'all' ? queue : queue.filter(i => i.status === filter);
  const counts: Record<Filter, number> = {
    all: queue.length,
    pending: queue.filter(i => i.status === 'pending').length,
    processing: queue.filter(i => i.status === 'processing').length,
    done: queue.filter(i => i.status === 'done').length,
    failed: queue.filter(i => i.status === 'failed').length,
  };

  const handleRetry = async (id: string) => {
    // Mark single item as pending and trigger queue
    await sendMessage({ type: 'QUEUE_RETRY' });
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Active' },
    { id: 'done', label: 'Done' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Sync Queue</h2>
            {queue.length > 0 && (
              <Badge variant="neutral">{queue.length}</Badge>
            )}
          </div>
          {counts.failed > 0 && (
            <Badge variant="error">{counts.failed} failed</Badge>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all duration-150 ${
                filter === f.id
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-surface-2 border-white/8 text-white/50 hover:text-white/80'
              }`}
            >
              {f.label}
              {counts[f.id] > 0 && (
                <span className="ml-1 opacity-70">{counts[f.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox size={32} className="text-white/15 mb-3" />
            <p className="text-sm text-white/30">
              {filter === 'all' ? 'Queue is empty' : `No ${filter} items`}
            </p>
            <p className="text-xs text-white/20 mt-1">
              Accepted LeetCode submissions will appear here
            </p>
          </div>
        ) : (
          filtered.map(item => (
            <QueueItemCard key={item.id} item={item} onRetry={handleRetry} />
          ))
        )}
      </div>

      {/* Footer actions */}
      {queue.length > 0 && (
        <div className="px-3 pb-3 pt-2 border-t border-white/6 flex gap-2">
          {counts.failed > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={12} />}
              onClick={retryQueue}
              className="flex-1"
            >
              Retry Failed
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
