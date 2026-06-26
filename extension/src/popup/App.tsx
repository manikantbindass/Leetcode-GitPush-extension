import { useEffect } from 'react';
import { LayoutDashboard, ListOrdered, Settings2, LogOut, ExternalLink } from 'lucide-react';
import { usePopupStore } from './store';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Queue } from './pages/Queue';
import { Settings } from './pages/Settings';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { onMessage } from '@/lib/messaging';

export default function App() {
  const {
    githubUser, isLoading, activeTab, queue,
    loadFromStorage, setActiveTab, triggerLogout,
  } = usePopupStore();

  const pendingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;

  useEffect(() => {
    loadFromStorage();

    // Listen for background updates
    const unsub = onMessage((msg) => {
      if (msg.type === 'QUEUE_UPDATE' || msg.type === 'SYNC_COMPLETE' || msg.type === 'SYNC_ERROR') {
        loadFromStorage();
      }
      if (msg.type === 'AUTH_COMPLETE') {
        loadFromStorage();
      }
    });
    return unsub;
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={12} /> },
    { id: 'queue',     label: `Queue${pendingCount ? ` (${pendingCount})` : ''}`, icon: <ListOrdered size={12} /> },
    { id: 'settings',  label: 'Settings',  icon: <Settings2 size={12} /> },
  ];

  if (isLoading) {
    return (
      <div
        style={{ width: 380, height: 560 }}
        className="bg-surface-0 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center animate-pulse-slow">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <p className="text-xs text-white/40">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: 380, height: 560 }}
      className="bg-surface-0 flex flex-col overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/6 bg-gradient-to-b from-surface-1 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(79,110,247,0.4)] shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold gradient-text leading-none">LeetCode AI Sync</p>
              <p className="text-[9px] text-white/30 leading-none mt-0.5">v1.0.0</p>
            </div>
          </div>

          {githubUser && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <img
                  src={githubUser.avatar_url}
                  alt={githubUser.login}
                  className="w-5 h-5 rounded-full border border-white/15"
                />
                <span className="text-xs text-white/60">{githubUser.login}</span>
              </div>
              <button
                onClick={triggerLogout}
                title="Disconnect GitHub"
                className="text-white/25 hover:text-white/60 transition-colors"
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      {!githubUser ? (
        <Auth />
      ) : (
        <>
          {/* Tab nav */}
          <div className="shrink-0 px-3 pt-2 pb-0">
            <Tabs
              tabs={tabs}
              active={activeTab}
              onChange={id => setActiveTab(id as typeof activeTab)}
            />
          </div>

          {/* Page */}
          <main className="flex-1 overflow-hidden flex flex-col min-h-0 mt-2">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'queue'     && <Queue />}
            {activeTab === 'settings'  && <Settings />}
          </main>
        </>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-1.5 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-white/15">LeetCode AI Sync</span>
        <a
          href="https://github.com/manikantbindass/Leetcode-GitPush-extension"
          target="_blank"
          rel="noreferrer"
          className="text-[9px] text-white/20 hover:text-white/40 transition-colors flex items-center gap-0.5"
        >
          GitHub <ExternalLink size={8} />
        </a>
      </div>
    </div>
  );
}
