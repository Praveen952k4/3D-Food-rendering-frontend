import React from 'react';
import {
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Restaurant,
  People,
  ExitToApp,
  LocalOffer,
  Feedback,
  Star,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminSidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/admin/orders' },
    { text: 'Food Items', icon: <Restaurant />, path: '/admin/food' },
    { text: 'Coupons', icon: <LocalOffer />, path: '/admin/coupons' },
    { text: 'Food Ratings', icon: <Star />, path: '/admin/food-ratings' },
    // { text: 'Feedback', icon: <Feedback />, path: '/admin/feedback' },
    { text: 'Users', icon: <People />, path: '/admin/users' },
  ];

  return (
    <div>
      <Toolbar>
        <Restaurant sx={{ mr: 2, color: '#667eea' }} />
        <Typography variant="h6" noWrap>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );
};

export default AdminSidebar;
