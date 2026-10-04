import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export interface IconButtonProps extends ComponentPropsWithoutRef<'button'> {
  'aria-label': string;
  icon?: ReactNode;
  variant?: 'default' | 'ghost' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const variantClasses: Record<'default' | 'ghost' | 'filled', string> = {
  default:
    'text-art-charcoal hover:text-art-ochre hover:bg-stone-100/60 focus-visible:ring-art-ochre',
  ghost:
    'text-stone-600 hover:text-art-charcoal hover:bg-stone-100/40 focus-visible:ring-art-ochre',
  filled: 'bg-white text-art-charcoal shadow-sm border border-art-stone hover:bg-stone-50',
};

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9 min-h-[36px] min-w-[36px] p-1.5 rounded-lg',
  md: 'h-11 w-11 min-h-[44px] min-w-[44px] p-2.5 rounded-xl',
  lg: 'h-12 w-12 min-h-[48px] min-w-[48px] p-3 rounded-xl',
};

export function IconButton({
  'aria-label': ariaLabel,
  icon,
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps): ReactNode {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon || children}
    </button>
  );
}
