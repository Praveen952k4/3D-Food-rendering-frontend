import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Restaurant,
  People,
  ExitToApp,
  LocalOffer,
  Star,
  ReceiptLong,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/admin/orders' },
  { text: 'GST report', icon: <ReceiptLong />, path: '/admin/gst' },
  { text: 'Food items', icon: <Restaurant />, path: '/admin/food' },
  { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
  { text: 'Food ratings', icon: <Star />, path: '/admin/food-ratings' },
  { text: 'Users', icon: <People />, path: '/admin/users' },
];

const AdminSidebar = ({ onLogout, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 2 }}>
      {/* brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pb: 2 }}>
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
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
            Admin panel
          </Typography>
          <Typography
            sx={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'text.disabled', fontWeight: 600 }}
          >
            AR Automated Dining
          </Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
            <ListItemButton selected={location.pathname === item.path} onClick={() => go(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List sx={{ borderTop: '1px solid var(--ad-line)', pt: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} primary="Log out" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default AdminSidebar;
