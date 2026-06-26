import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled,
  className,
}: SelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none bg-surface-2 border border-white/10 text-sm text-white rounded-lg px-3 py-2 pr-8 outline-none transition-all duration-200 cursor-pointer',
            'focus:border-brand-500/60 focus:shadow-[0_0_0_2px_rgba(79,110,247,0.15)]',
            disabled && 'opacity-50 cursor-not-allowed',
            !value && 'text-white/30'
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-surface-1">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
        />
      </div>
    </div>
  );
}
