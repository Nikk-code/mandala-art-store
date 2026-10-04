import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'terracotta';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-art-charcoal text-white hover:bg-stone-800 active:bg-black focus-visible:ring-art-ochre',
  secondary:
    'bg-white text-art-charcoal border border-art-stone hover:bg-stone-50 hover:border-art-sand active:bg-stone-100 focus-visible:ring-art-ochre',
  outline:
    'bg-transparent text-art-charcoal border border-art-charcoal hover:bg-art-charcoal hover:text-white focus-visible:ring-art-ochre',
  ghost: 'bg-transparent text-art-charcoal hover:bg-stone-100/70 focus-visible:ring-art-ochre',
  terracotta:
    'bg-art-terracotta text-white hover:bg-[#8F3F21] active:bg-[#79341B] focus-visible:ring-art-terracotta',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
  lg: 'min-h-[50px] px-7 py-3 text-base font-semibold rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
