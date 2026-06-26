import { useState } from 'react';
import { Github, Key, Eye, EyeOff, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GitHubAPI } from '@/lib/github/api';
import * as storage from '@/lib/storage';

export function Auth() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please paste your GitHub Personal Access Token');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const github = new GitHubAPI(token.trim());
      const user = await github.getUser();

      await storage.setMany({
        githubToken: token.trim(),
        githubUser: user,
      });

      // Reload popup to show dashboard
      window.location.reload();
    } catch (err: any) {
      setError(
        err?.message?.includes('401')
          ? 'Invalid token — make sure it has "repo" and "user" scopes.'
          : `Failed to connect: ${err?.message ?? String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-52 h-52 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-6 w-32 h-32 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-4 w-full">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,110,247,0.5)]">
          <svg viewBox="0 0 24 24" className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold gradient-text mb-1">LeetCode AI Sync</h1>
          <p className="text-xs text-white/45 leading-relaxed">
            Connect GitHub to start syncing your solutions
          </p>
        </div>

        {/* Token input card */}
        <div className="w-full bg-surface-2 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Key size={14} className="text-brand-400 shrink-0" />
            <span className="text-sm font-semibold text-white">GitHub Personal Access Token</span>
          </div>

          {/* Step 1 — create token */}
          <a
            href="https://github.com/settings/tokens/new?scopes=repo,user&description=LeetCode+AI+Sync"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full bg-brand-600/10 border border-brand-500/20 hover:border-brand-500/40 rounded-lg px-3 py-2.5 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Github size={14} className="text-brand-400" />
              <div>
                <p className="text-xs font-medium text-white">Step 1 — Create Token</p>
                <p className="text-[10px] text-white/40">Click to open GitHub (pre-fills repo + user scopes)</p>
              </div>
            </div>
            <ExternalLink size={11} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
          </a>

          {/* Step 2 — paste token */}
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Step 2 — Paste token here</p>
            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => { setToken(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-surface-1 border border-white/10 focus:border-brand-500/60 focus:shadow-[0_0_0_2px_rgba(79,110,247,0.15)] rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder-white/20 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(v => !v)}
                className="absolute right-2.5 text-white/30 hover:text-white/60 transition-colors"
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Connect button */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            disabled={!token.trim()}
            onClick={handleConnect}
            leftIcon={loading ? undefined : <Github size={15} />}
          >
            {loading ? 'Connecting…' : 'Connect GitHub'}
          </Button>
        </div>

        {/* Token instructions */}
        <div className="w-full bg-surface-2 border border-white/6 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Token setup guide</p>
          {[
            '1. Click "Create Token" above',
            '2. Set Expiration → No expiration (or 1 year)',
            '3. Scopes: ✓ repo  ✓ user (pre-selected)',
            '4. Click "Generate token"',
            '5. Copy and paste it above',
          ].map(step => (
            <p key={step} className="text-xs text-white/40">{step}</p>
          ))}
        </div>

        <p className="text-[10px] text-white/20 text-center">
          Token is stored locally in your browser only.<br />Never sent to any server.
        </p>
      </div>
    </div>
  );
}
