import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { FONT_DISPLAY } from '../../theme/muiTheme';
import { Skeleton } from '../ui/Loaders';

const TONES = {
  ember: { fg: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)' },
  basil: { fg: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  saffron: { fg: 'var(--ad-saffron)', wash: 'var(--ad-saffron-wash)' },
};

/**
 * A KPI tile. Flat surface with one tinted accent, rather than the old
 * full-bleed gradient — it reads the same in light and dark.
 */
const StatCard = ({ title, value, hint, icon, tone = 'ember', loading = false }) => {
  const { fg, wash } = TONES[tone] || TONES.ember;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent
        sx={{
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          alignItems: 'flex-start',
          p: { xs: 1.75, sm: 2.5 },
          '&:last-child': { pb: { xs: 1.75, sm: 2.5 } },
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'text.disabled',
            }}
          >
            {title}
          </Typography>

          {loading ? (
            <Skeleton height={30} width="70%" sx={{ mt: 1.5 }} />
          ) : (
            <Typography
              sx={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: { xs: 24, sm: 30 },
                lineHeight: 1.15,
                mt: 1,
                letterSpacing: '-0.02em',
                wordBreak: 'break-word',
              }}
            >
              {value}
            </Typography>
          )}

          {hint && !loading && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, mt: 0.5 }}
            >
              {hint}
            </Typography>
          )}
        </Box>

        {icon && (
          <Box
            sx={{
              width: { xs: 32, sm: 42 },
              height: { xs: 32, sm: 42 },
              borderRadius: '13px',
              display: 'grid',
              placeItems: 'center',
              background: wash,
              color: fg,
              flex: 'none',
              '& svg': { fontSize: { xs: 17, sm: 21 } },
            }}
          >
            {icon}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
