import { cn } from '@/lib/utils';
import type { QueueItem } from '@/types/submission';

interface StatusBadgeProps {
  status: QueueItem['status'];
  className?: string;
}

const config: Record<
  QueueItem['status'],
  { label: string; color: string; dot: string; animate?: boolean }
> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    dot: 'bg-yellow-400',
  },
  processing: {
    label: 'Syncing…',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    dot: 'bg-blue-400',
    animate: true,
  },
  done: {
    label: 'Pushed',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    dot: 'bg-green-400',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    dot: 'bg-red-400',
  },
  skipped: {
    label: 'Already Exists',
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    dot: 'bg-orange-400',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color, dot, animate } = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border',
        color,
        className
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', dot, animate && 'animate-pulse')}
      />
      {label}
    </span>
  );
}
