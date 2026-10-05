import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Input({
  label,
  id,
  error,
  helperText,
  required,
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: InputProps): ReactNode {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-art-charcoal tracking-wide">
          {label}
          {required && <span className="ml-1 text-art-terracotta">*</span>}
        </label>
      </div>

      <div className="relative">
        <input
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-art-charcoal placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400 min-h-[44px] ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-art-stone focus:border-art-ochre focus:ring-art-ochre/20'
          } ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 animate-fadeIn">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-stone-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
