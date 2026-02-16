import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'asterism-chat-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Theme) || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  // Resolve theme based on system preference or explicit choice
  const resolveTheme = useCallback((currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  }, []);

  // Update resolved theme when theme or system preference changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      setResolvedTheme(resolveTheme(theme));
    };

    updateResolvedTheme();

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateResolvedTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, resolveTheme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Only toggle the 'dark' class - don't add 'light' class
    // Tailwind's dark: modifier activates when 'dark' class is present
    // When dark class is absent, light styles are used by default
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set CSS variables based on theme
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#1C1C1E');
      root.style.setProperty('--bg-tertiary', '#2C2C2E');
      root.style.setProperty('--surface', '#1E1E20');
      root.style.setProperty('--border', '#38383A');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#8E8E93');
      root.style.setProperty('--text-tertiary', '#636366');
      root.style.setProperty('--accent-primary', '#0A84FF');
      root.style.setProperty('--accent-success', '#30D158');
      root.style.setProperty('--accent-warning', '#FF9F0A');
      root.style.setProperty('--accent-error', '#FF453A');
    } else {
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F2F2F7');
      root.style.setProperty('--bg-tertiary', '#E5E5EA');
      root.style.setProperty('--surface', '#FFFFFF');
      root.style.setProperty('--border', '#C6C6C8');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#6D6D72');
      root.style.setProperty('--text-tertiary', '#AEAEB2');
      root.style.setProperty('--accent-primary', '#007AFF');
      root.style.setProperty('--accent-success', '#34C759');
      root.style.setProperty('--accent-warning', '#FF9500');
      root.style.setProperty('--accent-error', '#FF3B30');
    }
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}