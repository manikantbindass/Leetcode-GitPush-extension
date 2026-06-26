import { getLanguageEmoji, getLanguageDisplayName, cn } from '@/lib/utils';
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
    if (selected.includes(lang)) {
      onChange(selected.filter(l => l !== lang));
    } else {
      onChange([...selected, lang]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">
          {selected.length}/{ALL_LANGUAGES.length} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onChange([...ALL_LANGUAGES])}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            All
          </button>
          <span className="text-white/20">·</span>
          <button
            onClick={() => onChange([])}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            None
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {ALL_LANGUAGES.map(lang => {
          const isSelected = selected.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg border text-center transition-all duration-150',
                isSelected
                  ? 'bg-brand-600/20 border-brand-500/40 text-white'
                  : 'bg-surface-2 border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
              )}
            >
              <span className="text-base leading-none">{getLanguageEmoji(lang)}</span>
              <span className="text-[9px] font-medium truncate w-full">
                {getLanguageDisplayName(lang)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
