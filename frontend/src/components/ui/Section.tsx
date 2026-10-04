import type { ReactNode, ComponentPropsWithoutRef } from 'react';

export type SectionSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type SectionBackground = 'transparent' | 'cream' | 'white' | 'stone' | 'charcoal';

export interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  spacing?: SectionSpacing;
  bg?: SectionBackground;
  background?: SectionBackground;
  children: ReactNode;
}

const spacingClasses: Record<SectionSpacing, string> = {
  none: 'py-0',
  sm: 'py-8 sm:py-10',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-20 lg:py-24',
  xl: 'py-20 sm:py-28 lg:py-32',
};

const bgClasses: Record<SectionBackground, string> = {
  transparent: 'bg-transparent',
  cream: 'bg-art-cream',
  white: 'bg-white',
  stone: 'bg-stone-50 border-y border-art-stone',
  charcoal: 'bg-art-charcoal text-white',
};

export function Section({
  spacing = 'md',
  bg,
  background,
  className = '',
  children,
  ...props
}: SectionProps): ReactNode {
  const chosenBg = background || bg || 'transparent';
  return (
    <section
      className={`${spacingClasses[spacing]} ${bgClasses[chosenBg]} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
