import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { RestaurantMenu, ReceiptLong } from '@mui/icons-material';
import TableBanner from './TableBanner';

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
  { to: '/customer/home', label: 'Menu', shortLabel: 'Menu', icon: <RestaurantMenu sx={{ fontSize: { xs: 15, sm: 17 } }} /> },
  { to: '/customer/orders', label: 'Orders & receipts', shortLabel: 'Orders', icon: <ReceiptLong sx={{ fontSize: { xs: 15, sm: 17 } }} /> },
];

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <TableBanner />

      <Box
        sx={{
          display: 'flex',
          gap: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 },
          py: 0.5,
          overflowX: 'auto',
          borderBottom: '1px solid var(--ad-line)',
          bgcolor: 'var(--ad-surface)',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Button
              key={link.to}
              size="small"
              startIcon={link.icon}
              onClick={() => navigate(link.to)}
              sx={{
                flex: { xs: '1 1 0', sm: 'none' },
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                px: { xs: 1, sm: 1.75 },
                py: { xs: 0.5, sm: 0.75 },
                minWidth: 0,
                borderRadius: '999px',
                color: active ? 'var(--ad-ember)' : 'text.secondary',
                bgcolor: active ? 'var(--ad-ember-wash)' : 'transparent',
                '&:hover': { bgcolor: active ? 'var(--ad-ember-wash)' : 'var(--ad-bg-2)' },
                whiteSpace: 'nowrap',
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{link.label}</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{link.shortLabel}</Box>
            </Button>
          );
        })}
      </Box>

      <Outlet />
    </div>
  );
};

export default CustomerLayout;
