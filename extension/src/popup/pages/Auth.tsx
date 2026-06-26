import { useState } from 'react';
import { Github, Key, Eye, EyeOff, ExternalLink, AlertCircle, Zap } from 'lucide-react';
import { GitHubAPI } from '@/lib/github/api';
import * as storage from '@/lib/storage';

export function Auth() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!token.trim()) { setError('Paste your GitHub Personal Access Token'); return; }
    setLoading(true); setError('');
    try {
      const github = new GitHubAPI(token.trim());
      const user = await github.getUser();
      await storage.setMany({ githubToken: token.trim(), githubUser: user });
      window.location.reload();
    } catch (err: any) {
      setError(
        err?.message?.includes('401')
          ? 'Invalid token — needs "repo" + "user" scopes'
          : `Connection failed: ${err?.message ?? String(err)}`
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background orbs */}
      <div className="pool-orb pool-orb-cyan"   style={{ width:220, height:220, top:-80,   left:'50%', transform:'translateX(-50%)' }} />
      <div className="pool-orb pool-orb-purple" style={{ width:160, height:160, bottom:-40, right:-40 }} />
      <div className="pool-orb pool-orb-pink"   style={{ width:100, height:100, bottom:60,  left:-30 }} />

      <div className="relative z-10 flex flex-col items-center gap-4 w-full">
        {/* Logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl glass-neon-cyan flex items-center justify-center animate-glow-pulse">
            <Zap size={32} style={{ color:'var(--neon-cyan)', filter:'drop-shadow(0 0 10px var(--neon-cyan))' }} />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-neon-pulse"
               style={{ background:'var(--neon-green)', boxShadow:'0 0 8px var(--neon-green)' }} />
        </div>

        <div className="text-center">
          <h1 className="text-lg font-display font-bold neon-text-cyan tracking-widest">LEETCODE AI SYNC</h1>
          <p className="text-[11px] text-white/30 mt-1 font-mono">Connect GitHub → auto-push solutions</p>
        </div>

        {/* Token input card */}
        <div className="w-full glass-neon-cyan rounded-2xl p-4 space-y-3 relative overflow-hidden">
          <div className="pool-orb pool-orb-cyan" style={{ width:80, height:80, top:-20, right:-20 }} />

          <div className="flex items-center gap-2 relative z-10">
            <Key size={13} style={{ color:'var(--neon-cyan)' }} />
            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
              GitHub Personal Access Token
            </span>
          </div>

          {/* Step 1 */}
          <a href="https://github.com/settings/tokens/new?scopes=repo,user&description=LeetCode+AI+Sync"
             target="_blank" rel="noreferrer"
             className="flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all group relative z-10"
             style={{ background:'rgba(0,245,255,0.06)', border:'1px solid rgba(0,245,255,0.2)' }}>
            <div className="flex items-center gap-2">
              <Github size={13} style={{ color:'var(--neon-cyan)' }} />
              <div>
                <p className="text-[11px] font-semibold text-white">Step 1 — Create Token</p>
                <p className="text-[9px] text-white/30 font-mono">Opens GitHub with repo+user scopes pre-filled</p>
              </div>
            </div>
            <ExternalLink size={10} className="text-white/20 group-hover:text-white/50 transition-colors" />
          </a>

          {/* Step 2 — paste token */}
          <div className="space-y-1.5 relative z-10">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
              ◆ Step 2 — Paste token
            </p>
            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => { setToken(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-xl px-3 py-2.5 pr-10 text-xs font-mono outline-none transition-all input-cyber"
              />
              <button type="button" onClick={() => setShowToken(v => !v)}
                      className="absolute right-3 text-white/20 hover:text-white/50 transition-colors">
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2 relative z-10"
                 style={{ background:'rgba(255,0,110,0.08)', border:'1px solid rgba(255,0,110,0.25)' }}>
              <AlertCircle size={12} style={{ color:'var(--neon-pink)', marginTop:1 }} />
              <p className="text-[11px] neon-text-pink">{error}</p>
            </div>
          )}

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="btn-cyber-solid w-full rounded-xl py-2.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed relative z-10"
          >
            {loading
              ? <><span className="animate-spin w-3 h-3 border border-black/30 border-t-black rounded-full" />CONNECTING…</>
              : <><Github size={13} />CONNECT GITHUB</>
            }
          </button>
        </div>

        {/* Guide */}
        <div className="w-full glass rounded-xl p-3 space-y-1.5"
             style={{ borderColor:'rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest">◆ Token setup</p>
          {['1. Click "Create Token" above',
            '2. Expiration → No expiration',
            '3. Scopes: ✓ repo  ✓ user  (pre-selected)',
            '4. Click "Generate token"',
            '5. Copy & paste above → Connect'].map(step => (
            <p key={step} className="text-[10px] text-white/30 font-mono">{step}</p>
          ))}
        </div>

        <p className="text-[9px] text-white/15 text-center font-mono">
          Token stored locally · never sent to any server
        </p>
      </div>
    </div>
  );
}
