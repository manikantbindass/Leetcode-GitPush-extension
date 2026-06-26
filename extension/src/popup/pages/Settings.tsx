import { useState } from 'react';
import { Save, AlertTriangle, ExternalLink } from 'lucide-react';
import { usePopupStore } from '../store';
import { RepoSelector } from '@/components/RepoSelector';
import { ProviderCard } from '@/components/ProviderCard';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Toggle } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import type { Repository } from '@/types/github';
import type { OutputLanguage } from '@/types/submission';

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

  const handleRepoChange = (repo: Repository) => {
    store.saveSettings({ selectedRepo: repo, selectedBranch: repo.default_branch });
  };

  const handleBranchChange = (branch: string) => {
    store.saveSettings({ selectedBranch: branch });
  };

  const handleProviderUpdate = (updated: AIProviderConfig) => {
    const providers = store.providers.map(p =>
      p.type === updated.type ? updated : p
    );
    store.saveSettings({ providers });
  };

  const handleSetActive = (type: AIProviderType) => {
    store.saveSettings({ activeProvider: type });
  };

  const handleLanguageChange = (langs: OutputLanguage[]) => {
    store.saveSettings({ targetLanguages: langs });
  };

  return (
    <div className="overflow-y-auto h-full">
      <div className="p-3 space-y-4">

        {/* ── Repository ─────────────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Repository</h3>
          <RepoSelector
            selectedRepo={store.selectedRepo}
            selectedBranch={store.selectedBranch}
            onRepoChange={handleRepoChange}
            onBranchChange={handleBranchChange}
          />
          <Select
            label="File naming style"
            value={store.fileNamingStyle}
            onChange={v => store.saveSettings({ fileNamingStyle: v as any })}
            options={[
              { value: 'number-slug', label: '0001-two-sum/0001-two-sum.java' },
              { value: 'slug', label: 'two-sum/two-sum.java' },
              { value: 'number-title', label: '0001-Two-Sum/0001-Two-Sum.java' },
            ]}
          />
          <Input
            label="Commit message template"
            value={store.commitTemplate}
            onChange={e => store.saveSettings({ commitTemplate: e.target.value })}
            placeholder="feat: add {title} (#{number})"
            hint="Variables: {title} {number} {difficulty} {language} {topics}"
          />
        </section>

        {/* ── AI Providers ───────────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">AI Provider</h3>
          {store.providers.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">No providers found. Reinstall extension.</p>
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

        {/* ── Output Languages ───────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Output Languages</h3>
          <LanguageSelector
            selected={store.targetLanguages as OutputLanguage[]}
            onChange={handleLanguageChange}
          />
        </section>

        {/* ── AI Folder Instructions ────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">AI Folder Instructions</h3>
          <p className="text-[10px] text-white/30 leading-relaxed">
            Tell the AI exactly where to place solutions. It reads your repo's folder structure and follows these instructions.
          </p>
          <div className="relative">
            <textarea
              value={store.customInstructions ?? ''}
              onChange={e => store.saveSettings({ customInstructions: e.target.value })}
              placeholder={`Examples:\n- MySQL/SQL problems → put in 'MySQL' folder\n- Array problems → put in 'Arrays' folder\n- Tree problems → put in 'Trees' folder\n- Sliding window → put in 'SlidingWindow' folder`}
              rows={6}
              className="w-full bg-surface-1 border border-white/10 focus:border-brand-500/60 focus:shadow-[0_0_0_2px_rgba(79,110,247,0.15)] rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/20 outline-none transition-all resize-none font-mono leading-relaxed"
            />
          </div>
          <p className="text-[10px] text-brand-400/70">
            💡 DeepSeek reads your repo folders + these instructions to decide where each solution goes.
          </p>
        </section>

        {/* ── Behavior ───────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Behavior</h3>
          <Toggle
            label="Auto-push"
            description="Automatically sync accepted submissions"
            checked={store.autoPush}
            onChange={v => store.saveSettings({ autoPush: v })}
          />
          <Toggle
            label="Dry-run mode"
            description="Generate solutions without pushing to GitHub"
            checked={store.dryRun}
            onChange={v => store.saveSettings({ dryRun: v })}
          />
        </section>

        {/* ── OAuth Server ───────────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">OAuth Setup</h3>
          <Input
            label="GitHub Client ID"
            value={store.githubClientId}
            onChange={e => store.saveSettings({ githubClientId: e.target.value })}
            placeholder="Your GitHub OAuth App Client ID"
          />
          <Input
            label="OAuth Server URL"
            value={store.oauthServerUrl}
            onChange={e => store.saveSettings({ oauthServerUrl: e.target.value })}
            placeholder="http://localhost:3001"
          />
          <a
            href="https://github.com/settings/developers"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            Create GitHub OAuth App <ExternalLink size={10} />
          </a>
        </section>

        {/* ── Danger Zone ───────────────────────────────────── */}
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={10} /> Danger Zone
          </h3>
          <div className="border border-red-500/15 rounded-lg p-3 space-y-2">
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={store.clearQueue}
            >
              Clear Sync Queue
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={store.triggerLogout}
            >
              Disconnect GitHub
            </Button>
          </div>
        </section>

        {/* Save button */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={saving}
          onClick={handleSave}
          leftIcon={<Save size={14} />}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
