import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { TableRestaurant, Logout } from '@mui/icons-material';
import { getMyTable, leaveTable } from '../services/api';
import { useMessage } from './ui/MessageDialog';

/**
 * The band at the top of a diner's screen telling them which table they are
 * at — and letting them say when they are leaving.
 *
 * That last part is the point: a table that is quietly abandoned is only
 * freed by housekeeping twenty minutes after the last course, and on a busy
 * evening twenty minutes is a table. Someone who taps this frees it at once.
 * It is refused while food is still coming, because walking out on it is
 * almost always a mistake rather than an intention.
 */
const TableBanner = () => {
  const [table, setTable] = useState(null);
  const [busy, setBusy] = useState(false);
  const { showError, confirmAction } = useMessage();

  const load = useCallback(async () => {
    try {
      const response = await getMyTable();
      setTable(response.data.table);
    } catch {
      setTable(null);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleLeave = async () => {
    const sure = await confirmAction({
      title: 'Finished your meal?',
      message: `Table ${table.number} will be freed for the next guests. You can always sign in again.`,
      confirmLabel: 'I am leaving',
      cancelLabel: 'Not yet',
    });
    if (!sure) return;

    setBusy(true);
    try {
      await leaveTable();
      setTable(null);
      localStorage.removeItem('cart');
      localStorage.removeItem('cartCustomization');
    } catch (err) {
      showError(err.response?.data?.message || 'Could not close your visit.', {
        title: 'Still at the table',
      });
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!table) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        flexWrap: 'wrap',
        px: { xs: 1.25, sm: 2 },
        py: { xs: 0.65, sm: 0.85 },
        borderBottom: '1px solid var(--ad-line)',
        bgcolor: 'var(--ad-basil-wash)',
      }}
    >
      <TableRestaurant sx={{ fontSize: { xs: 16, sm: 18 }, color: 'var(--ad-basil)' }} />
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '13px', sm: '14px' } }}>
        Table {table.number}
      </Typography>
      <Chip
        size="small"
        label={
          (table.activeOrders ?? 0) === 1
            ? '1 Order in progress'
            : `${table.activeOrders ?? 0} Orders in progress`
        }
        sx={{
          height: { xs: 22, sm: 24 },
          bgcolor: (table.activeOrders ?? 0) > 0 ? 'var(--ad-saffron-wash)' : 'var(--ad-surface-2)',
          color: (table.activeOrders ?? 0) > 0 ? 'var(--ad-warn)' : 'text.secondary',
          fontWeight: 600,
          border: '1px solid var(--ad-line)',
          fontSize: { xs: '11px', sm: '12px' },
          '& .MuiChip-label': {
            px: { xs: 0.75, sm: 1 },
          },
        }}
      />

      {table.canLeave && (
        <Button
          size="small"
          startIcon={<Logout sx={{ fontSize: { xs: 13, sm: 15 } }} />}
          disabled={busy}
          onClick={handleLeave}
          sx={{
            ml: 'auto',
            color: 'var(--ad-basil)',
            fontWeight: 600,
            fontSize: { xs: '11px', sm: '12px' },
            px: { xs: 0.75, sm: 1.25 },
            py: { xs: 0.25, sm: 0.5 },
            minWidth: 'auto',
          }}
        >
          I am leaving
        </Button>
      )}
    </Box>
  );
};

export default TableBanner;
