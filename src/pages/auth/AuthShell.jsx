import React from 'react';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * The frame every sign-in door shares: brand mark, title, and the themed card
 * the form sits in. Keeps the three doors looking like one system.
 */
const AuthShell = ({ eyebrow, title, subtitle, children, footer, back = '/', backLabel = 'Back to the home page', maxWidth = 'sm' }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'var(--ad-glow)',
        py: { xs: 3, sm: 6 },
      }}
    >
      <Container maxWidth={maxWidth}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(back)}
            sx={{ color: 'text.secondary', '&:hover': { color: 'var(--ad-ember)' } }}
          >
            {backLabel}
          </Button>
          <Box sx={{ ml: 'auto' }}>
            <ThemeToggle size="small" />
          </Box>
        </Box>

        <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 'var(--ad-radius-lg)' }}>
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                mx: 'auto',
                mb: 2,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                background: 'linear-gradient(145deg, var(--ad-ember), var(--ad-saffron))',
                boxShadow: '0 12px 26px -14px rgba(226,85,43,.9)',
              }}
            >
              AR
            </Box>

            {eyebrow && <Typography className="ad-eyebrow">{eyebrow}</Typography>}
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 26, sm: 30 }, mt: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mx: 'auto', maxWidth: 400 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {children}
        </Paper>

        {footer && (
          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            {footer}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default AuthShell;
