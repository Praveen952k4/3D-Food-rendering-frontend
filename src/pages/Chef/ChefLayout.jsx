import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LogoutIcon from '@mui/icons-material/Logout';

const ChefLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <RestaurantIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Chef Panel
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ fontWeight: 600 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
};

export default ChefLayout;
