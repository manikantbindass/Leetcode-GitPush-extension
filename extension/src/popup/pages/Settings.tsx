import { useState } from 'react';
import { Save, AlertTriangle, ExternalLink, GitBranch, Zap, Globe, Terminal, Cpu } from 'lucide-react';
import { usePopupStore } from '../store';
import { RepoSelector } from '@/components/RepoSelector';
import { ProviderCard } from '@/components/ProviderCard';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import type { Repository } from '@/types/github';
import type { OutputLanguage } from '@/types/submission';

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 4px var(--neon-cyan))' }}>{icon}</span>
      <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(0,245,255,0.5)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(0,245,255,0.2),transparent)' }} />
    </div>
  );
}

function CyberLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: 'rgba(0,245,255,0.35)' }}>{children}</p>;
}

function CyberInput({ label, value, onChange, placeholder, hint, type = 'text' }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; hint?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <CyberLabel>{label}</CyberLabel>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber"
      />
      {hint && <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{hint}</p>}
    </div>
  );
}

function CyberSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <CyberLabel>{label}</CyberLabel>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber appearance-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background: '#05050f' }}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CyberToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 glass rounded-xl transition-all"
         style={{ borderColor: checked ? 'rgba(0,245,255,0.2)' : 'rgba(255,255,255,0.05)' }}>
      <div>
        <p className="text-[11px] font-semibold text-white">{label}</p>
        {description && <p className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-all shrink-0 ml-3"
        style={{
          background: checked ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${checked ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.12)'}`,
          boxShadow: checked ? '0 0 10px rgba(0,245,255,0.4)' : 'none',
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            left: checked ? 'calc(100% - 18px)' : '2px',
            background: checked ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
            boxShadow: checked ? '0 0 6px var(--neon-cyan)' : 'none',
          }}
        />
      </button>
    </div>
  );
}

export function Settings() {
  const store = usePopupStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await store.saveSettings({
      selectedRepo: store.selectedRepo ?? undefined,
      selectedBranch: store.selectedBranch ?? undefined,
      activeProvider: store.activeProvider ?? undefined,
      providers: store.providers,
      targetLanguages: store.targetLanguages,
      fileNamingStyle: store.fileNamingStyle,
      commitTemplate: store.commitTemplate,
      autoPush: store.autoPush,
      dryRun: store.dryRun,
      oauthServerUrl: store.oauthServerUrl,
      githubClientId: store.githubClientId,
      customInstructions: store.customInstructions,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderUpdate = (updated: AIProviderConfig) => {
    store.saveSettings({ providers: store.providers.map(p => p.type === updated.type ? updated : p) });
  };
  const handleSetActive = (type: AIProviderType) => store.saveSettings({ activeProvider: type });
  const handleLanguageChange = (langs: OutputLanguage[]) => store.saveSettings({ targetLanguages: langs });

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-3 space-y-5">

        {/* ── Repository ──────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader icon={<GitBranch size={11} />} label="Repository" />
          <RepoSelector
            selectedRepo={store.selectedRepo}
            selectedBranch={store.selectedBranch}
            onRepoChange={(repo: Repository) => store.saveSettings({ selectedRepo: repo, selectedBranch: repo.default_branch })}
            onBranchChange={(branch: string) => store.saveSettings({ selectedBranch: branch })}
          />
          <CyberSelect
            label="File naming style"
            value={store.fileNamingStyle}
            onChange={v => store.saveSettings({ fileNamingStyle: v as any })}
            options={[
              { value: 'number-slug',  label: '0001-two-sum/0001-two-sum.java' },
              { value: 'slug',         label: 'two-sum/two-sum.java' },
              { value: 'number-title', label: '0001-Two-Sum/0001-Two-Sum.java' },
            ]}
          />
          <CyberInput
            label="Commit message template"
            value={store.commitTemplate}
            onChange={e => store.saveSettings({ commitTemplate: e.target.value })}
            placeholder="feat: add {title} (#{number})"
            hint="// vars: {title} {number} {difficulty} {language} {topics}"
          />
        </section>

        {/* ── AI Provider ─────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader icon={<Cpu size={11} />} label="AI Provider" />
          {store.providers.length === 0 ? (
            <p className="text-[10px] font-mono text-center py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              // no providers — reinstall extension
            </p>
          ) : (
            <div className="space-y-2">
              {store.providers.map(p => (
                <ProviderCard
                  key={p.type}
                  config={p}
                  isActive={store.activeProvider === p.type}
                  onUpdate={handleProviderUpdate}
                  onSetActive={handleSetActive}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Output Languages ────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader icon={<Terminal size={11} />} label="Output Languages" />
          <LanguageSelector
            selected={store.targetLanguages as OutputLanguage[]}
            onChange={handleLanguageChange}
          />
        </section>

        {/* ── AI Folder Instructions ───────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader icon={<Zap size={11} />} label="AI Folder Instructions" />
          <p className="text-[9px] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
            // DeepSeek reads your repo tree + these rules to decide folder placement
          </p>
          <textarea
            value={store.customInstructions ?? ''}
            onChange={e => store.saveSettings({ customInstructions: e.target.value })}
            placeholder={`- MySQL/SQL problems → 'MySQL' folder\n- Array problems → 'Arrays' folder\n- Tree problems → 'Trees' folder\n- Sliding window → 'SlidingWindow' folder\n- Stack problems → 'Stack' folder`}
            rows={5}
            className="w-full rounded-xl px-3 py-2.5 text-[11px] outline-none transition-all resize-none font-mono leading-relaxed input-cyber"
          />
          <p className="text-[9px] font-mono" style={{ color: 'rgba(0,245,255,0.4)' }}>
            ⚡ AI picks the exact existing folder name from your repo
          </p>
        </section>

        {/* ── Behavior ────────────────────────────────────────────── */}
        <section className="space-y-2">
          <SectionHeader icon={<Zap size={11} />} label="Behavior" />
          <CyberToggle
            label="Auto-push"
            description="// sync accepted submissions automatically"
            checked={store.autoPush}
            onChange={v => store.saveSettings({ autoPush: v })}
          />
          <CyberToggle
            label="Dry-run mode"
            description="// generate solutions without pushing to GitHub"
            checked={store.dryRun}
            onChange={v => store.saveSettings({ dryRun: v })}
          />
        </section>

        {/* ── OAuth Setup ──────────────────────────────────────────── */}
        <section className="space-y-2.5">
          <SectionHeader icon={<Globe size={11} />} label="OAuth Setup" />
          <CyberInput
            label="GitHub Client ID"
            value={store.githubClientId}
            onChange={e => store.saveSettings({ githubClientId: e.target.value })}
            placeholder="Your GitHub OAuth App Client ID"
          />
          <CyberInput
            label="OAuth Server URL"
            value={store.oauthServerUrl}
            onChange={e => store.saveSettings({ oauthServerUrl: e.target.value })}
            placeholder="http://localhost:3001"
          />
          <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer"
             className="flex items-center gap-1 transition-colors text-[10px] font-mono"
             style={{ color: 'rgba(0,245,255,0.5)' }}>
            ◆ Create GitHub OAuth App <ExternalLink size={9} />
          </a>
        </section>

        {/* ── Danger Zone ──────────────────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={10} style={{ color: 'var(--neon-pink)' }} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,0,110,0.5)' }}>
              Danger Zone
            </span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,rgba(255,0,110,0.2),transparent)' }} />
          </div>
          <div className="space-y-2 p-3 rounded-xl" style={{ border: '1px solid rgba(255,0,110,0.12)', background: 'rgba(255,0,110,0.03)' }}>
            <button onClick={store.clearQueue}
                    className="w-full rounded-xl py-2 text-[10px] font-mono font-semibold uppercase tracking-wider transition-all"
                    style={{ border: '1px solid rgba(255,0,110,0.25)', color: 'rgba(255,0,110,0.7)', background: 'transparent' }}>
              Clear Sync Queue
            </button>
            <button onClick={store.triggerLogout}
                    className="w-full rounded-xl py-2 text-[10px] font-mono font-semibold uppercase tracking-wider transition-all"
                    style={{ border: '1px solid rgba(255,0,110,0.35)', color: 'var(--neon-pink)', background: 'rgba(255,0,110,0.08)', boxShadow: '0 0 10px rgba(255,0,110,0.1)' }}>
              Disconnect GitHub
            </button>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-cyber-solid rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving
            ? <><span className="animate-spin w-3 h-3 border border-black/30 border-t-black rounded-full" />SAVING…</>
            : saved
            ? <><span style={{ color: 'inherit' }}>✓</span> SAVED!</>
            : <><Save size={12} />SAVE SETTINGS</>
          }
        </button>

        <div className="h-2" />
      </div>
    </div>
  );
}
