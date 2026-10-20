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
        gap: 1.5,
        flexWrap: 'wrap',
        px: 2,
        py: 1.25,
        borderBottom: '1px solid var(--ad-line)',
        bgcolor: 'var(--ad-basil-wash)',
      }}
    >
      <TableRestaurant sx={{ fontSize: 18, color: 'var(--ad-basil)' }} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Table {table.number}
      </Typography>
      {table.sittingMinutes !== null && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {table.sittingMinutes} min
        </Typography>
      )}
      {table.activeOrders > 0 && (
        <Chip
          size="small"
          label={`${table.activeOrders} order${table.activeOrders === 1 ? '' : 's'} coming`}
          sx={{ bgcolor: 'var(--ad-saffron-wash)', color: 'var(--ad-warn)', fontWeight: 600 }}
        />
      )}

      {table.canLeave && (
        <Button
          size="small"
          startIcon={<Logout sx={{ fontSize: 15 }} />}
          disabled={busy}
          onClick={handleLeave}
          sx={{ ml: 'auto', color: 'var(--ad-basil)', fontWeight: 600 }}
        >
          I am leaving
        </Button>
      )}
    </Box>
  );
};

export default TableBanner;
