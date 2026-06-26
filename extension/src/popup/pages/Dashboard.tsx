import { GitBranch, Zap, Clock, Flame, ExternalLink, RefreshCw } from 'lucide-react';
import { usePopupStore } from '../store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { timeAgo, formatDate, getDifficultyBgClass } from '@/lib/utils';

export function Dashboard() {
  const {
    solvedStats, recentSubmissions, selectedRepo, selectedBranch,
    activeProvider, providers, streak, lastSynced, queue, retryQueue,
  } = usePopupStore();

  const pendingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;
  const failedCount = queue.filter(i => i.status === 'failed').length;
  const activeProviderConfig = providers.find(p => p.type === activeProvider);

  return (
    <div className="p-3 space-y-3 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Easy', value: solvedStats.easy, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/15' },
          { label: 'Medium', value: solvedStats.medium, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/15' },
          { label: 'Hard', value: solvedStats.hard, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/15' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-lg border p-2.5 text-center ${bg}`}>
            <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
            <p className="text-[10px] text-white/50 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Total + Streak */}
      <div className="flex gap-2">
        <div className="flex-1 bg-surface-2 border border-white/8 rounded-lg p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-brand-400">{solvedStats.total}</span>
          </div>
          <div>
            <p className="text-xs font-medium text-white">Total Solved</p>
            {lastSynced && (
              <p className="text-[10px] text-white/30">{timeAgo(lastSynced)}</p>
            )}
          </div>
        </div>
        <div className="bg-surface-2 border border-white/8 rounded-lg p-3 flex items-center gap-2">
          <Flame size={18} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-xs font-medium text-white">{streak}</p>
            <p className="text-[10px] text-white/30">Day streak</p>
          </div>
        </div>
      </div>

      {/* Status bars */}
      <div className="space-y-1.5">
        {/* Repo */}
        <div className="flex items-center gap-2 bg-surface-2 border border-white/8 rounded-lg px-3 py-2">
          <GitBranch size={12} className="text-white/30 shrink-0" />
          {selectedRepo ? (
            <>
              <span className="text-xs text-white/70 truncate flex-1">
                {selectedRepo.full_name}
              </span>
              <span className="text-[10px] text-white/30 shrink-0">{selectedBranch}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            </>
          ) : (
            <span className="text-xs text-white/30">No repository selected</span>
          )}
        </div>

        {/* AI Provider */}
        <div className="flex items-center gap-2 bg-surface-2 border border-white/8 rounded-lg px-3 py-2">
          <Zap size={12} className="text-white/30 shrink-0" />
          {activeProviderConfig ? (
            <>
              <span className="text-xs text-white/70 flex-1">{activeProviderConfig.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
            </>
          ) : (
            <span className="text-xs text-white/30">No AI provider configured</span>
          )}
        </div>

        {/* Queue status */}
        {(pendingCount > 0 || failedCount > 0) && (
          <div className="flex items-center gap-2 bg-surface-2 border border-white/8 rounded-lg px-3 py-2">
            <Clock size={12} className="text-white/30 shrink-0" />
            <span className="text-xs text-white/70 flex-1">
              {pendingCount > 0 && `${pendingCount} pending`}
              {pendingCount > 0 && failedCount > 0 && ', '}
              {failedCount > 0 && `${failedCount} failed`}
            </span>
            {failedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={retryQueue} className="h-5 px-2 text-[10px]">
                <RefreshCw size={10} className="mr-1" />Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div>
        <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
          Recent
        </h3>
        {recentSubmissions.length === 0 ? (
          <div className="text-center py-6 text-white/25 text-xs">
            No submissions yet. Solve a LeetCode problem!
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentSubmissions.slice(0, 5).map(sub => {
              const qItem = queue.find(q => q.submission?.id === sub.id);
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 bg-surface-2 border border-white/6 rounded-lg px-3 py-2 hover:border-white/12 transition-colors"
                >
                  <span className="text-white/30 text-[10px] font-mono shrink-0 w-8">
                    #{sub.problemNumber}
                  </span>
                  <span className="text-xs text-white truncate flex-1">{sub.title}</span>
                  <Badge
                    variant={sub.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}
                    size="sm"
                  >
                    {sub.difficulty[0]}
                  </Badge>
                  {qItem && <StatusBadge status={qItem.status} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
