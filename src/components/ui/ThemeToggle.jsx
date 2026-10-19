import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../../context/ThemeContext';

/**
 * Light / dark switch. Reads and writes ThemeContext, which drives both the
 * MUI palette and the html[data-theme] CSS ramp, so every portal uses this one
 * control rather than rolling its own.
 */
const ThemeToggle = ({ size = 'medium', sx }) => {
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleTheme}
        size={size}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={{
          border: '1px solid var(--ad-line-strong)',
          borderRadius: '50%',
          color: 'text.secondary',
          '&:hover': { color: 'var(--ad-ember)', borderColor: 'var(--ad-ember)' },
          ...sx,
        }}
      >
        {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
