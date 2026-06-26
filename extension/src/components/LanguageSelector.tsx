import { getLanguageEmoji, getLanguageDisplayName } from '@/lib/utils';
import type { OutputLanguage } from '@/types/submission';

const ALL_LANGUAGES: OutputLanguage[] = [
  'java', 'python', 'go', 'cpp', 'c',
  'javascript', 'typescript', 'rust',
  'kotlin', 'swift', 'csharp', 'php',
  'ruby', 'dart', 'sql', 'pandas',
];

interface LanguageSelectorProps {
  selected: OutputLanguage[];
  onChange: (selected: OutputLanguage[]) => void;
}

export function LanguageSelector({ selected, onChange }: LanguageSelectorProps) {
  const toggle = (lang: OutputLanguage) => {
    onChange(selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono" style={{ color: 'rgba(0,245,255,0.4)' }}>
          {selected.length}/{ALL_LANGUAGES.length} selected
        </span>
        <div className="flex gap-3">
          <button onClick={() => onChange([...ALL_LANGUAGES])}
                  className="text-[9px] font-mono uppercase tracking-wider transition-colors"
                  style={{ color: 'var(--neon-cyan)' }}>
            ALL
          </button>
          <button onClick={() => onChange([])}
                  className="text-[9px] font-mono uppercase tracking-wider transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>
            NONE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {ALL_LANGUAGES.map(lang => {
          const on = selected.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              className="flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl text-center transition-all duration-150"
              style={{
                background:  on ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.03)',
                border:      `1px solid ${on ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow:   on ? '0 0 8px rgba(0,245,255,0.2)' : 'none',
                color:       on ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.35)',
              }}
            >
              <span className="text-sm leading-none">{getLanguageEmoji(lang)}</span>
              <span className="text-[8px] font-mono truncate w-full"
                    style={{ textShadow: on ? '0 0 6px rgba(0,245,255,0.6)' : 'none' }}>
                {getLanguageDisplayName(lang)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
