import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'easy' | 'medium' | 'hard'
  | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  easy:    'text-green-400  bg-green-400/10  border-green-400/20',
  medium:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  hard:    'text-red-400    bg-red-400/10    border-red-400/20',
  success: 'text-green-400  bg-green-400/10  border-green-400/20',
  warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  error:   'text-red-400    bg-red-400/10    border-red-400/20',
  info:    'text-blue-400   bg-blue-400/10   border-blue-400/20',
  neutral: 'text-white/60   bg-white/5       border-white/10',
  purple:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

export function Badge({ variant = 'neutral', size = 'md', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
