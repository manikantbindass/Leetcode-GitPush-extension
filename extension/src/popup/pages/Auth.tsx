import { Button } from '@/components/ui/Button';
import { Github } from 'lucide-react';
import { usePopupStore } from '../store';

export function Auth() {
  const { triggerAuth } = usePopupStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-8 w-32 h-32 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,110,247,0.5)]">
          <svg viewBox="0 0 24 24" className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold gradient-text mb-1">LeetCode AI Sync</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Auto-push accepted solutions to GitHub<br />
            in 14+ languages with AI generation
          </p>
        </div>

        {/* Features */}
        <div className="w-full space-y-2">
          {[
            '⚡ AI-powered multi-language generation',
            '🔀 Auto-detect LeetCode submissions',
            '📦 Smart GitHub repository sync',
            '📊 Auto-maintained README stats',
          ].map(f => (
            <div key={f} className="flex items-center gap-2.5 text-xs text-white/50 bg-white/4 rounded-lg px-3 py-2 border border-white/6">
              {f}
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Github size={18} />}
          onClick={triggerAuth}
          className="mt-2"
        >
          Connect GitHub
        </Button>

        <p className="text-[10px] text-white/25 text-center leading-relaxed">
          Your API keys are stored locally and never leave your browser.
          <br />OAuth uses your own GitHub app for security.
        </p>
      </div>
    </div>
  );
}
