import { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, Lock, Globe } from 'lucide-react';
import type { Repository } from '@/types/github';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { sendMessage } from '@/lib/messaging';

interface RepoSelectorProps {
  selectedRepo: Repository | null;
  selectedBranch: string | null;
  onRepoChange: (repo: Repository) => void;
  onBranchChange: (branch: string) => void;
}

export function RepoSelector({
  selectedRepo,
  selectedBranch,
  onRepoChange,
  onBranchChange,
}: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await sendMessage<{ repos?: Repository[]; error?: string }>({
        type: 'FETCH_REPOS',
      });
      if (res.repos) setRepos(res.repos);
    } finally {
      setLoadingRepos(false);
    }
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
        // Auto-select default branch if none selected
        if (!selectedBranch && res.branches.includes(repo.default_branch)) {
          onBranchChange(repo.default_branch);
        }
      }
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  useEffect(() => {
    if (selectedRepo) fetchBranches(selectedRepo);
  }, [selectedRepo?.id]);

  const handleRepoChange = (fullName: string) => {
    const repo = repos.find(r => r.full_name === fullName);
    if (repo) onRepoChange(repo);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <Select
          label="Repository"
          value={selectedRepo?.full_name ?? ''}
          onChange={handleRepoChange}
          placeholder="Select a repository…"
          options={repos.map(r => ({ value: r.full_name, label: r.full_name }))}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          loading={loadingRepos}
          onClick={fetchRepos}
          className="mb-0 shrink-0"
          title="Refresh repositories"
        >
          <RefreshCw size={14} />
        </Button>
      </div>

      {selectedRepo && (
        <div className="flex items-center gap-2">
          {selectedRepo.private ? (
            <Badge variant="neutral"><Lock size={9} className="mr-1" />Private</Badge>
          ) : (
            <Badge variant="info"><Globe size={9} className="mr-1" />Public</Badge>
          )}
          <span className="text-xs text-white/30 truncate">{selectedRepo.html_url}</span>
        </div>
      )}

      {selectedRepo && (
        <div className="flex gap-2 items-end">
          <Select
            label="Branch"
            value={selectedBranch ?? ''}
            onChange={onBranchChange}
            placeholder={loadingBranches ? 'Loading…' : 'Select branch…'}
            options={branches.map(b => ({ value: b, label: b }))}
            className="flex-1"
          />
          <div className="mb-0 shrink-0 flex items-center text-white/30 pb-2">
            <GitBranch size={14} />
          </div>
        </div>
      )}
    </div>
  );
}
