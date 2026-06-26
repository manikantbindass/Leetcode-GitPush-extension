import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import { sendMessage } from '@/lib/messaging';

interface ProviderCardProps {
  config: AIProviderConfig;
  isActive: boolean;
  onUpdate: (config: AIProviderConfig) => void;
  onSetActive: (type: AIProviderType) => void;
}

const PROVIDER_META: Record<AIProviderType, { neonColor: string; icon: string; glow: string }> = {
  deepseek: { neonColor: 'var(--neon-cyan)',   icon: '🧠', glow: 'rgba(0,245,255,0.3)' },
  openai:   { neonColor: 'var(--neon-green)',  icon: '🤖', glow: 'rgba(57,255,20,0.3)' },
  claude:   { neonColor: 'var(--neon-orange)', icon: '🔮', glow: 'rgba(255,149,0,0.3)' },
  gemini:   { neonColor: 'var(--neon-purple)', icon: '✨', glow: 'rgba(191,0,255,0.3)' },
  ollama:   { neonColor: 'var(--neon-pink)',   icon: '🦙', glow: 'rgba(255,0,110,0.3)' },
  custom:   { neonColor: 'rgba(255,255,255,0.4)', icon: '⚙️', glow: 'rgba(255,255,255,0.1)' },
};

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

export function ProviderCard({ config, isActive, onUpdate, onSetActive }: ProviderCardProps) {
  const [expanded, setExpanded] = useState(isActive);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testError, setTestError] = useState('');
  const [local, setLocal] = useState<AIProviderConfig>(config);

  const meta = PROVIDER_META[config.type];

  const handleChange = (field: keyof AIProviderConfig, value: string) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onUpdate(updated);
  };

  const handleTest = async () => {
    setTestState('testing');
    setTestError('');
    try {
      const res = await sendMessage<{ success: boolean; error?: string }>({ type: 'TEST_PROVIDER', payload: local });
      setTestState(res.success ? 'ok' : 'fail');
      if (!res.success) setTestError(res.error ?? 'Connection failed');
    } catch (err) { setTestState('fail'); setTestError(String(err)); }
    setTimeout(() => setTestState('idle'), 4000);
  };

  const borderColor = isActive ? meta.neonColor : 'rgba(255,255,255,0.07)';
  const bgColor     = isActive ? `${meta.neonColor}08` : 'rgba(255,255,255,0.02)';

  return (
    <div className="rounded-xl transition-all duration-200 overflow-hidden"
         style={{ border: `1px solid ${borderColor}`, background: bgColor,
                  boxShadow: isActive ? `0 0 16px ${meta.glow}` : 'none' }}>
      {/* Header */}
      <button onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center gap-3 p-3 text-left">
        <span className="text-lg shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold" style={{ color: meta.neonColor, textShadow: `0 0 8px ${meta.glow}` }}>
              {config.name}
            </span>
            {isActive && (
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: meta.neonColor, background: `${meta.neonColor}15`, border: `1px solid ${meta.neonColor}40` }}>
                ACTIVE
              </span>
            )}
            {testState === 'ok' && <CheckCircle size={11} style={{ color: 'var(--neon-green)' }} />}
          </div>
          <p className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {local.model ?? '// no model set'}
          </p>
        </div>
        {expanded
          ? <ChevronUp size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
          : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
        }
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5"
             style={{ borderTop: `1px solid ${borderColor}30` }}>
          <div className="pt-2.5 space-y-2">
            {config.type !== 'ollama' && (
              <div className="space-y-1">
                <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(0,245,255,0.35)' }}>API Key</p>
                <input
                  type="password"
                  value={local.apiKey ?? ''}
                  onChange={e => handleChange('apiKey', e.target.value)}
                  placeholder="sk-…  /  your api key"
                  className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber"
                />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(0,245,255,0.35)' }}>Model</p>
              <input
                value={local.model ?? ''}
                onChange={e => handleChange('model', e.target.value)}
                placeholder="e.g. deepseek-coder"
                className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber"
              />
            </div>
            {(config.type === 'ollama' || config.type === 'custom') && (
              <div className="space-y-1">
                <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(0,245,255,0.35)' }}>Base URL</p>
                <input
                  value={local.baseUrl ?? ''}
                  onChange={e => handleChange('baseUrl', e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none transition-all input-cyber"
                />
              </div>
            )}
          </div>

          {/* Test result */}
          {testState === 'fail' && testError && (
            <p className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--neon-pink)' }}>
              <XCircle size={10} /> {testError}
            </p>
          )}
          {testState === 'ok' && (
            <p className="text-[9px] font-mono flex items-center gap-1" style={{ color: 'var(--neon-green)' }}>
              <CheckCircle size={10} /> Connection successful ✓
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testState === 'testing'}
              className="flex-1 rounded-xl py-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider transition-all disabled:opacity-40"
              style={{ border: '1px solid rgba(0,245,255,0.25)', color: 'var(--neon-cyan)', background: 'rgba(0,245,255,0.05)' }}
            >
              {testState === 'testing' ? '…TESTING' : testState === 'ok' ? '✓ OK' : testState === 'fail' ? '✗ FAIL' : 'TEST'}
            </button>
            {!isActive && (
              <button
                onClick={() => onSetActive(config.type)}
                disabled={!local.apiKey && config.type !== 'ollama'}
                className="flex-1 btn-cyber-solid rounded-xl py-1.5 flex items-center justify-center gap-1 disabled:opacity-30"
              >
                <Zap size={9} />SET ACTIVE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
