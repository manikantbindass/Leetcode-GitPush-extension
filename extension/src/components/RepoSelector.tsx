import { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, Lock, Globe } from 'lucide-react';
import type { Repository } from '@/types/github';
import { sendMessage } from '@/lib/messaging';

interface RepoSelectorProps {
  selectedRepo: Repository | null;
  selectedBranch: string | null;
  onRepoChange: (repo: Repository) => void;
  onBranchChange: (branch: string) => void;
}

function CyberLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: 'rgba(0,245,255,0.35)' }}>{children}</p>;
}

export function RepoSelector({ selectedRepo, selectedBranch, onRepoChange, onBranchChange }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await sendMessage<{ repos?: Repository[]; error?: string }>({ type: 'FETCH_REPOS' });
      if (res.repos) setRepos(res.repos);
    } finally { setLoadingRepos(false); }
  };

  const fetchBranches = async (repo: Repository) => {
    setLoadingBranches(true);
    try {
      const res = await sendMessage<{ branches?: string[]; error?: string }>({
        type: 'FETCH_BRANCHES',
        payload: { owner: repo.owner, repo: repo.name },
      });
      if (res.branches) {
        setBranches(res.branches);
        if (!selectedBranch && res.branches.includes(repo.default_branch)) {
          onBranchChange(repo.default_branch);
        }
      }
    } finally { setLoadingBranches(false); }
  };

  useEffect(() => { fetchRepos(); }, []);
  useEffect(() => { if (selectedRepo) fetchBranches(selectedRepo); }, [selectedRepo?.id]);

  const handleRepoChange = (fullName: string) => {
    const repo = repos.find(r => r.full_name === fullName);
    if (repo) onRepoChange(repo);
  };

  return (
    <div className="space-y-2.5">
      {/* Repo picker */}
      <div className="space-y-1">
        <CyberLabel>Repository</CyberLabel>
        <div className="flex gap-2 items-center">
          <select
            value={selectedRepo?.full_name ?? ''}
            onChange={e => handleRepoChange(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber appearance-none cursor-pointer"
          >
            <option value="" style={{ background: '#05050f' }}>— select repository —</option>
            {repos.map(r => (
              <option key={r.full_name} value={r.full_name} style={{ background: '#05050f' }}>{r.full_name}</option>
            ))}
          </select>
          <button
            onClick={fetchRepos}
            disabled={loadingRepos}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all shrink-0"
            style={{ border: '1px solid rgba(0,245,255,0.2)', color: 'var(--neon-cyan)', background: 'rgba(0,245,255,0.05)' }}
            title="Refresh repositories"
          >
            <RefreshCw size={12} className={loadingRepos ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Repo meta */}
      {selectedRepo && (
        <div className="flex items-center gap-2 px-1">
          <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={selectedRepo.private
                  ? { color: 'var(--neon-orange)', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)' }
                  : { color: 'var(--neon-cyan)', background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }
                }>
            {selectedRepo.private ? <Lock size={8} /> : <Globe size={8} />}
            {selectedRepo.private ? 'PRIVATE' : 'PUBLIC'}
          </span>
          <span className="text-[9px] font-mono truncate" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {selectedRepo.html_url}
          </span>
        </div>
      )}

      {/* Branch picker */}
      {selectedRepo && (
        <div className="space-y-1">
          <CyberLabel>Branch</CyberLabel>
          <div className="flex gap-2 items-center">
            <select
              value={selectedBranch ?? ''}
              onChange={e => onBranchChange(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber appearance-none cursor-pointer"
            >
              {loadingBranches
                ? <option style={{ background: '#05050f' }}>Loading…</option>
                : branches.map(b => <option key={b} value={b} style={{ background: '#05050f' }}>{b}</option>)
              }
            </select>
            <div className="w-8 h-8 flex items-center justify-center" style={{ color: 'rgba(0,245,255,0.3)' }}>
              <GitBranch size={13} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
