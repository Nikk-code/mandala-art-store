import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export type BadgeVariant = 'default' | 'ochre' | 'terracotta' | 'stone' | 'success' | 'outline';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-art-charcoal text-white',
  ochre: 'bg-art-ochre/15 text-art-ochre border border-art-ochre/30',
  terracotta: 'bg-art-terracotta/15 text-art-terracotta border border-art-terracotta/30',
  stone: 'bg-art-stone text-art-charcoal',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  outline: 'bg-transparent text-art-charcoal border border-art-stone',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps): ReactNode {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
