import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, ExternalLink } from 'lucide-react';
import type { QueueItem } from '@/types/submission';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { StatusBadge } from './StatusBadge';
import { timeAgo, getLanguageEmoji } from '@/lib/utils';

interface QueueItemCardProps {
  item: QueueItem;
  onRetry: (id: string) => void;
}

export function QueueItemCard({ item, onRetry }: QueueItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { submission } = item;
  const diff = submission.difficulty as 'Easy' | 'Medium' | 'Hard';
  const diffVariant = diff.toLowerCase() as 'easy' | 'medium' | 'hard';

  return (
    <div className="bg-surface-2 border border-white/8 rounded-lg p-3 space-y-2 hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/40 text-xs font-mono">
              #{submission.problemNumber}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {submission.title}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={diffVariant}>{submission.difficulty}</Badge>
            <span className="text-xs text-white/30">
              {getLanguageEmoji(submission.language)} {submission.language}
            </span>
            <span className="text-xs text-white/25">{timeAgo(item.createdAt)}</span>
          </div>
        </div>
        <StatusBadge status={item.status} className="shrink-0" />
      </div>

      {item.status === 'done' && item.filesCreated?.length ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">
            {item.filesCreated.length} files pushed
          </span>
          {item.repoUrl && (
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              View commit <ExternalLink size={10} />
            </a>
          )}
        </div>
      ) : null}

      {item.status === 'failed' && (
        <div className="space-y-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Show'} error
          </button>
          {expanded && item.lastError && (
            <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-md p-2 font-mono break-all">
              {item.lastError}
            </p>
          )}
          <Button
            variant="danger"
            size="sm"
            leftIcon={<RotateCcw size={12} />}
            onClick={() => onRetry(item.id)}
          >
            Retry ({item.attempts}/5)
          </Button>
        </div>
      )}
    </div>
  );
}
