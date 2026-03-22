'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('pcb-theme');
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  }, [theme]);

  const setTheme = (value) => {
    const next = value === 'dark' ? 'dark' : 'light';
    setThemeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pcb-theme', next);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

