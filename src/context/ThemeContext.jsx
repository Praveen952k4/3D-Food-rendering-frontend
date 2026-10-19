import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeModeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    // Get saved theme from localStorage or default to 'light'
    return localStorage.getItem('themeMode') || 'light';
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem('themeMode', themeMode);
    // Drive the global CSS token ramp in index.css
    document.documentElement.setAttribute('data-theme', themeMode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeMode === 'dark' ? '#141110' : '#fbf7f2');
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
