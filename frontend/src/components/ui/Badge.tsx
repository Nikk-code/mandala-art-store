import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export type BadgeVariant = 'default' | 'ochre' | 'terracotta' | 'stone' | 'success' | 'outline';

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-art-charcoal text-white dark:bg-stone-800 dark:text-stone-100 dark:border dark:border-art-darkborder',
  ochre: 'bg-art-ochre/15 text-art-ochre border border-art-ochre/30',
  terracotta: 'bg-art-terracotta/15 text-art-terracotta border border-art-terracotta/30',
  stone:
    'bg-art-stone text-art-charcoal dark:bg-art-darkstone dark:text-stone-200 dark:border dark:border-art-darkborder',
  success:
    'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  outline:
    'bg-transparent text-art-charcoal border border-art-stone dark:text-stone-300 dark:border-art-darkborder',
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
