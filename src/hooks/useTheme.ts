import { useState, useEffect } from 'react';
import { ThemeMode } from '../types/logistics';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('freightfox_theme') as ThemeMode;
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to dark mode for enterprise telemetry cockpit feel
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('freightfox_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
}
