import { useEffect } from 'react';
import { LayoutDashboard, ListOrdered, Settings2, LogOut, ExternalLink, Zap } from 'lucide-react';
import { usePopupStore } from './store';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Queue } from './pages/Queue';
import { Settings } from './pages/Settings';
import { onMessage } from '@/lib/messaging';

export default function App() {
  const {
    githubUser, isLoading, activeTab, queue,
    loadFromStorage, setActiveTab, triggerLogout,
  } = usePopupStore();

  const pendingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;
  const failedCount  = queue.filter(i => i.status === 'failed').length;

  useEffect(() => {
    loadFromStorage();
    const unsub = onMessage((msg) => {
      if (['QUEUE_UPDATE','SYNC_COMPLETE','SYNC_ERROR','AUTH_COMPLETE'].includes(msg.type)) {
        loadFromStorage();
      }
    });
    return unsub;
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={11} /> },
    { id: 'queue',     label: pendingCount ? `Queue (${pendingCount})` : 'Queue', icon: <ListOrdered size={11} /> },
    { id: 'settings',  label: 'Settings',  icon: <Settings2 size={11} /> },
  ];

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ width: 420, height: 600, background: 'var(--bg-void)' }}
           className="flex items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="pool-orb pool-orb-cyan"   style={{ width:200, height:200, top:-60,  left:-60  }} />
        <div className="pool-orb pool-orb-purple" style={{ width:150, height:150, bottom:-40, right:-40 }} />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center glass-neon-cyan">
              <Zap size={28} style={{ color:'var(--neon-cyan)', filter:'drop-shadow(0 0 8px var(--neon-cyan))' }} />
            </div>
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-display font-bold neon-text-cyan tracking-wider">LEETCODE AI SYNC</p>
            <div className="flex gap-1 justify-center mt-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full animate-neon-pulse"
                     style={{ background:'var(--neon-cyan)', animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 420, height: 600, background: 'var(--bg-void)' }}
         className="flex flex-col overflow-hidden relative">

      {/* Background ambient glow */}
      <div className="pool-orb pool-orb-purple" style={{ width:200, height:200, top:-80, right:-80, opacity:0.4 }} />
      <div className="pool-orb pool-orb-cyan"   style={{ width:120, height:120, bottom:60, left:-40, opacity:0.3 }} />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-3 pb-2.5 relative z-10"
           style={{ borderBottom: '1px solid rgba(0,245,255,0.08)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center relative glass-neon-cyan shrink-0">
              <Zap size={15} style={{ color:'var(--neon-cyan)', filter:'drop-shadow(0 0 6px var(--neon-cyan))' }} />
            </div>
            <div>
              <p className="text-[11px] font-display font-bold tracking-widest neon-text-cyan leading-none">
                LEETCODE AI SYNC
              </p>
              <p className="text-[8px] text-white/20 leading-none mt-0.5 tracking-wider font-mono">v1.0.0</p>
            </div>
          </div>

          {/* User */}
          {githubUser && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 glass rounded-full px-2 py-1"
                   style={{ borderColor:'rgba(0,245,255,0.15)' }}>
                <div className="relative">
                  <img src={githubUser.avatar_url} alt={githubUser.login}
                       className="w-4 h-4 rounded-full" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-neon-pulse"
                        style={{ background:'var(--neon-green)', boxShadow:'0 0 4px var(--neon-green)' }} />
                </div>
                <span className="text-[10px] text-white/50 font-mono">{githubUser.login}</span>
              </div>
              <button onClick={triggerLogout} title="Disconnect"
                      className="text-white/20 hover:text-[color:var(--neon-pink)] transition-colors">
                <LogOut size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      {!githubUser ? (
        <Auth />
      ) : (
        <>
          {/* Cyberpunk Tab bar */}
          <div className="shrink-0 px-4 pt-2 relative z-10">
            <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold tracking-wider uppercase transition-all relative"
                    style={{
                      color: isActive ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
                      textShadow: isActive ? '0 0 8px var(--neon-cyan)' : 'none',
                    }}
                  >
                    <span style={{ filter: isActive ? 'drop-shadow(0 0 4px var(--neon-cyan))' : 'none' }}>
                      {tab.icon}
                    </span>
                    {tab.label}
                    {/* Active underline glow */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-px animate-glow-pulse"
                            style={{ background: 'var(--neon-cyan)', boxShadow: '0 0 6px var(--neon-cyan)' }} />
                    )}
                    {/* Failed badge */}
                    {tab.id === 'queue' && failedCount > 0 && (
                      <span className="text-[8px] px-1 py-0.5 rounded-sm font-mono neon-text-pink"
                            style={{ background:'rgba(255,0,110,0.15)', border:'1px solid rgba(255,0,110,0.3)' }}>
                        {failedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative z-10 mt-1"
                style={{ scrollbarGutter: 'stable' }}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'queue'     && <Queue />}
            {activeTab === 'settings'  && <Settings />}
          </main>
        </>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-1.5 flex items-center justify-between relative z-10"
           style={{ borderTop:'1px solid rgba(0,245,255,0.05)' }}>
        <span className="text-[8px] font-mono" style={{ color:'rgba(0,245,255,0.2)' }}>
          AUTO-SYNC ACTIVE ◆
        </span>
        <a href="https://github.com/manikantbindass/Leetcode-GitPush-extension"
           target="_blank" rel="noreferrer"
           className="text-[8px] font-mono flex items-center gap-0.5 transition-colors"
           style={{ color:'rgba(0,245,255,0.2)' }}>
          GitHub <ExternalLink size={7} />
        </a>
      </div>
    </div>
  );
}
