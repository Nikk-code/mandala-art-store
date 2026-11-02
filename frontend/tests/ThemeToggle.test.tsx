import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '@/context';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { THEME_STORAGE_KEY } from '@/constants';

function ConsumerComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark-val">{isDark ? 'yes' : 'no'}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe('Theme Context & ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to light theme when no stored preference exists', () => {
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('no');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('restores stored dark theme from localStorage on initial render', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('yes');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles theme from light to dark and persists to localStorage and document.documentElement', () => {
    render(
      <ThemeProvider>
        <ConsumerComponent />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /Toggle Theme/i });
    fireEvent.click(button);

    expect(screen.getByTestId('theme-val').textContent).toBe('dark');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('yes');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Toggle back to light
    fireEvent.click(button);
    expect(screen.getByTestId('theme-val').textContent).toBe('light');
    expect(screen.getByTestId('is-dark-val').textContent).toBe('no');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('renders ThemeToggle button with accessible aria-label and switches theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /Switch to dark mode/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Switch to light mode/i })).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /Switch to light mode/i }));
    expect(screen.getByRole('button', { name: /Switch to dark mode/i })).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

