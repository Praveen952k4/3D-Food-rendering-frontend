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
