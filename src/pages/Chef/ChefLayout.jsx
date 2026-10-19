import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const ChefLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        sx={{
          backdropFilter: 'blur(14px)',
          backgroundColor: 'color-mix(in srgb, var(--ad-surface) 88%, transparent)',
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '11px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
              background: 'linear-gradient(145deg, var(--ad-ember), var(--ad-saffron))',
              boxShadow: '0 8px 20px -8px rgba(226,85,43,.8)',
            }}
          >
            AR
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16, lineHeight: 1.2 }} noWrap>
              Kitchen studio
            </Typography>
            <Typography
              sx={{
                fontSize: 9.5,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'text.disabled',
                fontWeight: 600,
              }}
            >
              AR Automated Dining
            </Typography>
          </Box>

          <ThemeToggle size="small" />
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ color: 'text.secondary', '&:hover': { color: 'var(--ad-ember)' } }}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
};

export default ChefLayout;
