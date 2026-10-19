import { createTheme } from '@mui/material';

/**
 * "Ember & Basil" — the single palette shared by the landing page, the Admin,
 * Chef and Customer portals. The hex values here are the same tokens declared
 * in src/styles/theme.css, mirrored into MUI so MUI surfaces and plain-CSS
 * surfaces never disagree in either mode.
 */
export const palette = {
  ember: '#e2552b',
  emberSoft: '#ff7a4d',
  emberDeep: '#c8451f',
  saffron: '#f2a541',
  saffronSoft: '#ffc876',
  basil: '#2f7d62',
  basilSoft: '#4fa683',
  danger: '#c5412f',
  warn: '#d08700',
  light: {
    bg: '#fbf7f2',
    bg2: '#f4ede4',
    surface: '#ffffff',
    surface2: '#fbf5ee',
    line: 'rgba(30, 20, 14, 0.10)',
    lineStrong: 'rgba(30, 20, 14, 0.18)',
    text: '#1e1714',
    text2: '#6b5c52',
    text3: '#9a8a7e',
  },
  dark: {
    bg: '#141110',
    bg2: '#1c1816',
    surface: '#221d1a',
    surface2: '#2b2521',
    line: 'rgba(255, 255, 255, 0.09)',
    lineStrong: 'rgba(255, 255, 255, 0.16)',
    text: '#f5efe9',
    text2: '#b7aba2',
    text3: '#857a72',
  },
};

/** The categorical series used by every recharts graph, in order. */
export const chartSeries = [
  palette.ember,
  palette.basil,
  palette.saffron,
  palette.emberSoft,
  palette.basilSoft,
  palette.saffronSoft,
];

export const FONT_BODY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const FONT_DISPLAY = '"Playfair Display", "Iowan Old Style", Georgia, serif';

export const buildTheme = (mode) => {
  const isDark = mode === 'dark';
  const ramp = isDark ? palette.dark : palette.light;
  const accent = isDark ? palette.emberSoft : palette.ember;

  return createTheme({
    palette: {
      mode,
      primary: { main: accent, dark: palette.emberDeep, light: palette.emberSoft, contrastText: '#ffffff' },
      secondary: {
        main: isDark ? palette.basilSoft : palette.basil,
        contrastText: '#ffffff',
      },
      success: { main: isDark ? palette.basilSoft : palette.basil, contrastText: '#ffffff' },
      warning: { main: palette.saffron, contrastText: '#241a0c' },
      error: { main: isDark ? '#f0705c' : palette.danger, contrastText: '#ffffff' },
      info: { main: isDark ? palette.saffronSoft : palette.saffron, contrastText: '#241a0c' },
      background: { default: ramp.bg, paper: ramp.surface },
      text: { primary: ramp.text, secondary: ramp.text2, disabled: ramp.text3 },
      divider: ramp.line,
      action: {
        hover: isDark ? 'rgba(255, 122, 77, 0.10)' : 'rgba(226, 85, 43, 0.07)',
        selected: isDark ? 'rgba(255, 122, 77, 0.18)' : 'rgba(226, 85, 43, 0.12)',
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: FONT_BODY,
      h1: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.02em' },
      h4: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '-0.015em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      overline: { letterSpacing: '0.18em', fontWeight: 700, fontSize: 11 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: ramp.bg, transition: 'background-color .25s ease, color .25s ease' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: ramp.line },
          elevation1: {
            border: `1px solid ${ramp.line}`,
            boxShadow: isDark
              ? '0 2px 14px -10px rgba(0,0,0,.9)'
              : '0 2px 14px -10px rgba(63,38,22,.45)',
          },
        },
        defaultProps: { elevation: 1 },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${ramp.line}`,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 2px 14px -10px rgba(0,0,0,.9)'
              : '0 2px 14px -10px rgba(63,38,22,.45)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: ramp.surface,
            color: ramp.text,
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: `1px solid ${ramp.line}`,
          },
        },
        defaultProps: { elevation: 0, color: 'default' },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundColor: ramp.surface, borderRight: `1px solid ${ramp.line}`, backgroundImage: 'none' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 999, paddingInline: 20 },
          containedPrimary: {
            boxShadow: '0 12px 26px -16px rgba(226,85,43,.95)',
            '&:hover': { backgroundColor: isDark ? palette.ember : palette.emberSoft, boxShadow: '0 14px 28px -14px rgba(226,85,43,.95)' },
          },
          outlined: { borderColor: ramp.lineStrong },
        },
        defaultProps: { disableElevation: true },
      },
      MuiIconButton: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 999 },
          outlined: { borderColor: ramp.lineStrong },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginInline: 8,
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(255,122,77,.16)' : 'rgba(226,85,43,.12)',
              color: accent,
              '& .MuiListItemIcon-root': { color: accent },
              '&:hover': { backgroundColor: isDark ? 'rgba(255,122,77,.22)' : 'rgba(226,85,43,.17)' },
            },
          },
        },
      },
      MuiListItemIcon: { styleOverrides: { root: { minWidth: 40, color: ramp.text2 } } },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 24, border: `1px solid ${ramp.line}`, backgroundImage: 'none' } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22 } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 14, backgroundColor: ramp.surface },
          notchedOutline: { borderColor: ramp.lineStrong },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: ramp.line },
          head: {
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: ramp.text3,
            backgroundColor: ramp.surface2,
          },
        },
      },
      MuiTabs: {
        styleOverrides: { indicator: { height: 3, borderRadius: 3, backgroundColor: accent } },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, '&.Mui-selected': { color: accent } },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: ramp.text, color: ramp.bg, fontSize: 12, borderRadius: 10 },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: ramp.line } } },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 99, backgroundColor: ramp.bg2 },
          bar: { borderRadius: 99 },
        },
      },
      MuiSkeleton: { styleOverrides: { root: { backgroundColor: ramp.bg2 } } },
    },
  });
};

export default buildTheme;
