import React from 'react';
import { Box, Typography } from '@mui/material';
import FloorBoard from 'components/admin/FloorBoard';
import { FONT_DISPLAY } from 'theme/muiTheme';

/**
 * The floor, for the person on the door.
 *
 * Seating is walk-in, so the only question asked at the front is which tables
 * are free right now — and the answer has to be current, which is why the
 * board underneath keeps itself up to date rather than waiting to be
 * refreshed. Clearing a table a party has plainly left is the one edit staff
 * need to make here.
 */
const AdminTables = () => (
  <Box>
    <Box sx={{ mb: 2.5 }}>
      <Typography className="ad-eyebrow">Front of house</Typography>
      <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 24, mt: 0.5 }}>
        Tables
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        Which tables are free, who is sitting at the rest, and how long they have been there.
      </Typography>
    </Box>

    <FloorBoard />
  </Box>
);

export default AdminTables;
