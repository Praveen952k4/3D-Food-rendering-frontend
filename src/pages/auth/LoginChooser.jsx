import React from 'react';
import { Box, Typography } from '@mui/material';
import { TableRestaurant, PersonOutline, SoupKitchen, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * Three doors — picked here so nobody has to work out which one applies to
 * them. Customers, admins and kitchen staff all sign in with a phone number
 * and a one-time code; the role attached to the number decides where they
 * land. Guests need no account at all, just their table number.
 */
const DOORS = [
  {
    to: '/login/guest',
    icon: <TableRestaurant />,
    tone: 'basil',
    title: 'I am at a table',
    detail: 'Just your table number. No account, no OTP.',
  },
  {
    to: '/login/customer',
    icon: <PersonOutline />,
    tone: 'ember',
    title: 'I have an account',
    detail: 'Sign in with your phone number and a one-time code.',
  },
  {
    to: '/login/chef',
    icon: <SoupKitchen />,
    tone: 'saffron',
    title: 'Kitchen staff',
    detail: 'Your staff phone number and a one-time code.',
  },
];

const TONES = {
  ember: { fg: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)' },
  basil: { fg: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  saffron: { fg: 'var(--ad-warn)', wash: 'var(--ad-saffron-wash)' },
};

const LoginChooser = () => {
  const navigate = useNavigate();

  return (
    <AuthShell
      eyebrow="Sign in"
      title="How are you joining us?"
      subtitle="Guests, customers and kitchen staff each sign in their own way."
    >
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {DOORS.map((door) => {
          const tone = TONES[door.tone];
          return (
            <Box
              key={door.to}
              role="button"
              tabIndex={0}
              onClick={() => navigate(door.to)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(door.to);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                cursor: 'pointer',
                border: '1px solid var(--ad-line)',
                borderRadius: 'var(--ad-radius)',
                bgcolor: 'var(--ad-surface)',
                transition: 'transform .18s ease, border-color .18s ease',
                '&:hover, &:focus-visible': {
                  transform: 'translateY(-2px)',
                  borderColor: tone.fg,
                  outline: 'none',
                },
                '&:hover .ad-door-arrow, &:focus-visible .ad-door-arrow': { color: tone.fg, transform: 'translateX(3px)' },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: tone.wash,
                  color: tone.fg,
                  flex: 'none',
                  '& svg': { fontSize: 22 },
                }}
              >
                {door.icon}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17 }}>
                  {door.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {door.detail}
                </Typography>
              </Box>

              <ArrowForward
                className="ad-door-arrow"
                sx={{ ml: 'auto', flex: 'none', fontSize: 18, color: 'text.disabled', transition: 'color .18s ease, transform .18s ease' }}
              />
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', mt: 3 }}>
        Restaurant owners sign in through the customer door with their registered phone number.
      </Typography>
    </AuthShell>
  );
};

export default LoginChooser;
