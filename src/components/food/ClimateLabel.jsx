import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { climateFor } from '../../utils/climate';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const TONES = {
  basil: { fg: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)', bar: '' },
  saffron: { fg: 'var(--ad-warn)', wash: 'var(--ad-saffron-wash)', bar: 'is-warm' },
  ember: { fg: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)', bar: 'is-warm' },
};

const ESTIMATE_NOTE =
  'Estimated from the dish category, whether it is vegetarian and its calories — indicative, not a measured audit.';

/**
 * The climate label: an A–E grade with the carbon and water cost behind it.
 *
 * `variant="chip"` is the compact badge for a menu card; `variant="card"` is
 * the full panel for the dish dialog and the cart.
 */
const ClimateLabel = ({ food, variant = 'chip', sx }) => {
  if (!food) return null;
  const c = climateFor(food);
  const tone = TONES[c.tone] || TONES.basil;

  if (variant === 'chip') {
    return (
      <Tooltip title={`${c.label} · ${c.carbon} kg CO₂e · ${c.water} L water. ${ESTIMATE_NOTE}`}>
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            borderRadius: 999,
            px: 1,
            py: 0.375,
            fontSize: 10.5,
            fontWeight: 600,
            bgcolor: tone.wash,
            color: tone.fg,
            border: `1px solid ${tone.fg}3d`,
            ...sx,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 15,
              height: 15,
              borderRadius: '5px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: tone.fg,
              color: '#fff',
              fontSize: 9.5,
              fontWeight: 700,
              flex: 'none',
            }}
          >
            {c.grade}
          </Box>
          {c.carbon} kg CO₂e
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        border: '1px solid var(--ad-line)',
        borderRadius: 'var(--ad-radius)',
        bgcolor: 'var(--ad-surface)',
        p: 2,
        ...sx,
      }}
    >
      <Typography className="ad-eyebrow is-basil" sx={{ mb: 1.25 }}>
        Climate label
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            background: `linear-gradient(150deg, ${tone.fg}, ${tone.fg}b3)`,
            color: '#fff',
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 23,
            flex: 'none',
          }}
        >
          {c.grade}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{c.label}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {c.carbon} kg CO₂e per serving
          </Typography>
        </Box>
      </Box>

      {[
        { label: 'Carbon', value: `${c.carbon} kg CO₂e`, pct: c.carbonPct, warm: true },
        { label: 'Water', value: `${c.water} L`, pct: c.waterPct, warm: false },
        { label: 'Sourced locally', value: `${c.local}%`, pct: c.local, warm: false },
      ].map((row) => (
        <Box key={row.label} sx={{ mt: 1.75 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {row.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {row.value}
            </Typography>
          </Box>
          <div className={`ad-bar${row.warm && tone.bar ? ` ${tone.bar}` : ''}`}>
            <i style={{ width: `${row.pct}%` }} />
          </div>
        </Box>
      ))}

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 2, pt: 1.5, borderTop: '1px solid var(--ad-line)', color: 'text.disabled', fontSize: 11 }}
      >
        {ESTIMATE_NOTE}
      </Typography>
    </Box>
  );
};

export default ClimateLabel;
