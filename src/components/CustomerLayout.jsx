import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { RestaurantMenu, ReceiptLong, EventSeat } from '@mui/icons-material';
import TableBanner from './TableBanner';
import { useAuth } from '../context/AuthContext';

/**
 * The frame every diner screen sits in: which table they are at, and the few
 * places they need to get to.
 *
 * The nav exists because order history had no link anywhere in the app. The
 * page was there, and so was the e-receipt the restaurant releases to it, but
 * the only way to reach either was to type the URL — so a customer told their
 * receipt had been sent had nowhere to go and look at it.
 */
const LINKS = [
  { to: '/customer/home', label: 'Menu', icon: <RestaurantMenu sx={{ fontSize: 17 }} /> },
  { to: '/customer/orders', label: 'Orders & receipts', icon: <ReceiptLong sx={{ fontSize: 17 }} /> },
  { to: '/customer/bookings', label: 'My bookings', icon: <EventSeat sx={{ fontSize: 17 }} />, accountOnly: true },
];

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  // A guest signs in by table number and has no account to hold a booking, so
  // that door is not shown to them.
  const links = LINKS.filter((link) => !link.accountOnly || role !== 'guest');

  return (
    <div>
      <TableBanner />

      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: { xs: 1, sm: 2 },
          py: 0.75,
          overflowX: 'auto',
          borderBottom: '1px solid var(--ad-line)',
          bgcolor: 'var(--ad-surface)',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Button
              key={link.to}
              size="small"
              startIcon={link.icon}
              onClick={() => navigate(link.to)}
              sx={{
                flex: 'none',
                fontWeight: 600,
                fontSize: 13,
                color: active ? 'var(--ad-ember)' : 'text.secondary',
                bgcolor: active ? 'var(--ad-ember-wash)' : 'transparent',
                '&:hover': { bgcolor: active ? 'var(--ad-ember-wash)' : 'var(--ad-bg-2)' },
              }}
            >
              {link.label}
            </Button>
          );
        })}
      </Box>

      <Outlet />
    </div>
  );
};

export default CustomerLayout;
