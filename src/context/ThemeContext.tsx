import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'ldoe_theme_preference';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

/** Browser chrome colour per theme; keep in sync with `--bg` in index.css. */
const THEME_COLOR: Record<ThemeMode, string> = { light: '#f6f6f4', dark: '#0f1012' };

const osTheme = (): ThemeMode => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/**
 * Saved choice. With nothing saved (first visit) or the retired 'system' value from an older version,
 * the OS preference decides; dark when it cannot be read.
 */
export function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return osTheme();
  } catch {
    /* storage or matchMedia unavailable: use the default */
  }
  return 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* the choice just won't persist */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')), []);

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  return useContext(ThemeContext);
}
