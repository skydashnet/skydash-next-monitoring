'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = "cosmic" | "clarity" | "terminal";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('cosmic');

  useEffect(() => {
    const storedTheme = localStorage.getItem('skydash-theme') as Theme | null;
    if (storedTheme && ['cosmic', 'clarity', 'terminal'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('skydash-theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-clarity', 'theme-terminal');
    if (theme !== 'cosmic') {
        root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const value = { theme, setTheme };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};