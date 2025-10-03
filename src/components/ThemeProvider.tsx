import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Theme } from '../types';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme } = useAppContext();

  useEffect(() => {
    // Apply theme to the document
    const root = document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Determine which theme to apply
    let themeToApply: Theme = theme;
    
    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }
    
    // Apply the theme class
    root.classList.add(`theme-${themeToApply}`);
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;