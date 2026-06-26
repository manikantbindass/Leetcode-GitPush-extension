import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  type = 'text',
  className,
  ...props
}: InputProps) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-white/60 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-white/40 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          type={inputType}
          className={cn(
            'w-full bg-surface-2 border text-sm text-white placeholder-white/25 rounded-lg px-3 py-2 outline-none transition-all duration-200',
            error
              ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.15)]'
              : 'border-white/10 focus:border-brand-500/60 focus:shadow-[0_0_0_2px_rgba(79,110,247,0.15)]',
            leftIcon && 'pl-9',
            (rightIcon || isPassword) && 'pr-9',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 text-white/40 hover:text-white/70 transition-colors"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <span className="absolute right-3 text-white/40 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}
