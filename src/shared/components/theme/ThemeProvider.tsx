'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type ThemeContextValue = { theme: ThemePreference; setTheme: (theme: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => undefined });

function applyTheme(preference: ThemePreference) {
  const resolved = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setPreference] = useState<ThemePreference>('system');
  useEffect(() => {
    const stored = localStorage.getItem('scenezy_theme') as ThemePreference | null;
    const initial = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    setPreference(initial); applyTheme(initial);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if ((localStorage.getItem('scenezy_theme') || 'system') === 'system') applyTheme('system'); };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  const setTheme = (next: ThemePreference) => { localStorage.setItem('scenezy_theme', next); setPreference(next); applyTheme(next); };
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
