import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { THEME_STORAGE_KEY } from '@/constants';
import { ThemeContext } from './ThemeContext';
import type { Theme, ThemeContextValue } from '@/types';

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

function getInitialTheme(defaultTheme?: Theme): Theme {
  if (typeof window === 'undefined') {
    return defaultTheme || 'light';
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Storage access may be restricted in private browsing
  }

  if (defaultTheme) {
    return defaultTheme;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps): ReactNode {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme(defaultTheme));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage access may fail silently
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const contextValue: ThemeContextValue = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
