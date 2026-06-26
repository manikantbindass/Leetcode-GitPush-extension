import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import type { AIProviderConfig, AIProviderType } from '@/types/ai';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '@/lib/utils';
import { sendMessage } from '@/lib/messaging';

interface ProviderCardProps {
  config: AIProviderConfig;
  isActive: boolean;
  onUpdate: (config: AIProviderConfig) => void;
  onSetActive: (type: AIProviderType) => void;
}

const PROVIDER_META: Record<AIProviderType, { color: string; icon: string }> = {
  deepseek: { color: 'text-cyan-400', icon: '🧠' },
  openai:   { color: 'text-green-400', icon: '🤖' },
  claude:   { color: 'text-orange-400', icon: '🔮' },
  gemini:   { color: 'text-blue-400', icon: '✨' },
  ollama:   { color: 'text-purple-400', icon: '🦙' },
  custom:   { color: 'text-gray-400',  icon: '⚙️' },
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
      const res = await sendMessage<{ success: boolean; error?: string }>({
        type: 'TEST_PROVIDER',
        payload: local,
      });
      setTestState(res.success ? 'ok' : 'fail');
      if (!res.success) setTestError(res.error ?? 'Connection failed');
    } catch (err) {
      setTestState('fail');
      setTestError(String(err));
    }
    setTimeout(() => setTestState('idle'), 4000);
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isActive
          ? 'border-brand-500/50 bg-brand-600/5'
          : 'border-white/8 bg-surface-2 hover:border-white/15'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span className="text-xl shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold', meta.color)}>{config.name}</span>
            {isActive && <Badge variant="success" size="sm">Active</Badge>}
            {local.apiKey && testState === 'ok' && (
              <CheckCircle size={12} className="text-green-400" />
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5">
            {local.model ?? 'No model set'}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-white/30 shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-white/30 shrink-0" />
        )}
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          {config.type !== 'ollama' && (
            <Input
              label="API Key"
              type="password"
              value={local.apiKey ?? ''}
              onChange={e => handleChange('apiKey', e.target.value)}
              placeholder="sk-…"
            />
          )}
          <Input
            label="Model"
            value={local.model ?? ''}
            onChange={e => handleChange('model', e.target.value)}
            placeholder="e.g. deepseek-coder"
          />
          {(config.type === 'ollama' || config.type === 'custom') && (
            <Input
              label="Base URL"
              value={local.baseUrl ?? ''}
              onChange={e => handleChange('baseUrl', e.target.value)}
              placeholder="http://localhost:11434"
            />
          )}

          {/* Error */}
          {testState === 'fail' && testError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <XCircle size={12} /> {testError}
            </p>
          )}
          {testState === 'ok' && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle size={12} /> Connection successful
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              loading={testState === 'testing'}
              leftIcon={testState === 'ok' ? <CheckCircle size={12} /> : testState === 'fail' ? <XCircle size={12} /> : undefined}
              onClick={handleTest}
            >
              Test
            </Button>
            {!isActive && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Zap size={12} />}
                onClick={() => onSetActive(config.type)}
                disabled={!local.apiKey && config.type !== 'ollama'}
              >
                Set Active
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
