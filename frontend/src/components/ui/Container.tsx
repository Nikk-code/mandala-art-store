import type { ReactNode, ElementType, ComponentPropsWithoutRef } from 'react';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '7xl' | 'full';

export interface ContainerProps<T extends ElementType = 'div'> {
  as?: T;
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function Container<T extends ElementType = 'div'>({
  as,
  size = '7xl',
  className = '',
  children,
  ...props
}: ContainerProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof ContainerProps<T>>): ReactNode {
  const Component = as || 'div';
  return (
    <Component
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
