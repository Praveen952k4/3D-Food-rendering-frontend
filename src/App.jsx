import React, { useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext';
import AppRoutes from './components/routing/AppRoutes';

/**
 * Single accent hue (jade) + one neutral ramp, mirrored from the CSS tokens in
 * index.css so MUI surfaces and plain CSS surfaces never disagree.
 */
const buildTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#3fbfa6' : '#0b6e5f',
        contrastText: mode === 'dark' ? '#04120f' : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#94a39d' : '#4a5651',
      },
      background: {
        default: mode === 'dark' ? '#080c0b' : '#f4f6f4',
        paper: mode === 'dark' ? '#0f1513' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#eaf0ed' : '#0e1512',
        secondary: mode === 'dark' ? '#94a39d' : '#4a5651',
      },
      divider: mode === 'dark' ? '#222c29' : '#dde1dd',
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Outfit", "Segoe UI", system-ui, sans-serif',
      button: { textTransform: 'none', fontWeight: 600 },
    },
  });

const ThemedApp = () => {
  const { themeMode } = useThemeMode();
  const theme = useMemo(() => buildTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}

export default App;
