import { useEffect } from 'react';
import { Settings2, LayoutDashboard, ListOrdered, Github, ExternalLink } from 'lucide-react';
import { usePopupStore } from '@/popup/store';
import { Settings } from '@/popup/pages/Settings';
import { Dashboard } from '@/popup/pages/Dashboard';
import { Queue } from '@/popup/pages/Queue';

type Section = 'dashboard' | 'queue' | 'settings';

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'queue',     label: 'Sync Queue', icon: <ListOrdered size={16} /> },
  { id: 'settings',  label: 'Settings',   icon: <Settings2 size={16} /> },
];

export default function App() {
  const { loadFromStorage, activeTab, setActiveTab, githubUser, queue } = usePopupStore();
  const pendingCount = queue.filter(i => i.status === 'pending' || i.status === 'processing').length;

  useEffect(() => { loadFromStorage(); }, []);

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/8 bg-surface-1 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-[0_0_16px_rgba(79,110,247,0.4)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold gradient-text">LeetCode AI Sync</p>
              <p className="text-[10px] text-white/30">v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === item.id
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'queue' && pendingCount > 0 && (
                <span className="ml-auto text-[10px] bg-brand-600 text-white rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        {githubUser && (
          <div className="p-3 border-t border-white/8">
            <div className="flex items-center gap-2">
              <img
                src={githubUser.avatar_url}
                alt={githubUser.login}
                className="w-7 h-7 rounded-full border border-white/15"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{githubUser.login}</p>
                <p className="text-[10px] text-white/30">Connected</p>
              </div>
              <a href={githubUser.html_url} target="_blank" rel="noreferrer"
                className="text-white/25 hover:text-white/50 transition-colors">
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-white/6">
          <a
            href="https://github.com/manikantbindass/Leetcode-GitPush-extension"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            <Github size={12} /> View on GitHub
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-lg">
              <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>
              <Dashboard />
            </div>
          )}
          {activeTab === 'queue' && (
            <div className="max-w-lg">
              <h1 className="text-xl font-bold text-white mb-6">Sync Queue</h1>
              <Queue />
            </div>
          )}
          {activeTab === 'settings' && (
            <div>
              <h1 className="text-xl font-bold text-white mb-6">Settings</h1>
              <Settings />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
