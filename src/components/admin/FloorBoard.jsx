import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { Refresh, TableRestaurant } from '@mui/icons-material';
import io from 'socket.io-client';
import { getFloorTables, freeTable } from 'services/api';
import { useMessage } from 'components/ui/MessageDialog';
import { SkeletonText } from 'components/ui/Loaders';
import { FONT_DISPLAY } from 'theme/muiTheme';

/**
 * The floor as it stands: which tables are taken, how long each party has
 * been sitting, and which of them have eaten and could leave.
 *
 * Tables free themselves — when the party says they are going, or when
 * housekeeping finds one quiet since its last course — so the button here is
 * for the cases that beat the clock: a party that has plainly gone, or a
 * table being turned over for someone waiting.
 */
const FloorBoard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const { showError, confirmAction } = useMessage();
  const socketRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getFloorTables();
      setData(response.data);
    } catch (err) {
      console.error('Failed to load the floor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tables change as guests arrive and leave, so the board keeps itself
  // current rather than going stale on a wall screen.
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.on('tableChange', () => load());
    return () => socketRef.current?.disconnect();
  }, [load]);

  const handleFree = async (table) => {
    const sure = await confirmAction({
      title: `Clear table ${table.number}?`,
      message: table.activeOrders
        ? `This party still has ${table.activeOrders} order(s) coming. Clearing now ends their session.`
        : 'The table will be free for the next guests.',
      confirmLabel: 'Clear it',
      cancelLabel: 'Leave it',
      destructive: Boolean(table.activeOrders),
    });
    if (!sure) return;

    setBusy(table.number);
    try {
      await freeTable(table.number);
      await load();
    } catch (err) {
      showError(err.response?.data?.message || 'Could not clear that table.');
    } finally {
      setBusy('');
    }
  };

  const tables = data?.tables || [];
  const settings = data?.settings || {};

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography className="ad-eyebrow">Floor</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mt: 0.5 }}>
            Who is sitting where
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {data ? `${data.occupied} of ${tables.length} tables taken` : 'Loading the floor'}
            {settings.idleMinutes
              ? ` · a table frees itself ${settings.idleMinutes} min after its last course, a no-show after ${settings.graceMinutes} min`
              : ''}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <span style={{ marginLeft: 'auto' }}>
            <IconButton onClick={load} disabled={loading} sx={{ border: '1px solid var(--ad-line-strong)' }}>
              <Refresh fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading && !data ? (
        <SkeletonText lines={4} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {tables.map((table) => (
            <Box
              key={table.number}
              sx={{
                p: 1.5,
                borderRadius: 'var(--ad-radius-sm)',
                border: '1px solid',
                borderColor: table.isOccupied ? 'var(--ad-ember)' : 'var(--ad-line)',
                bgcolor: table.isOccupied ? 'var(--ad-ember-wash)' : 'var(--ad-surface)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <TableRestaurant
                  sx={{ fontSize: 16, color: table.isOccupied ? 'var(--ad-ember)' : 'text.disabled' }}
                />
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {table.label || `Table ${table.number}`}
                </Typography>
              </Box>

              {table.isOccupied ? (
                <>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    {table.occupantName || 'Guest'} · {table.sittingMinutes} min
                    {table.heldVia === 'booking' ? ' · booked' : ''}
                  </Typography>

                  {table.activeOrders > 0 ? (
                    <Chip
                      size="small"
                      label={`${table.activeOrders} cooking`}
                      sx={{ mt: 0.75, bgcolor: 'var(--ad-saffron-wash)', color: 'var(--ad-warn)', fontWeight: 600 }}
                    />
                  ) : table.canLeave ? (
                    <Chip
                      size="small"
                      label={
                        table.freesItselfInMinutes
                          ? `Free in ${table.freesItselfInMinutes} min`
                          : 'Freeing now'
                      }
                      sx={{ mt: 0.75, bgcolor: 'var(--ad-basil-wash)', color: 'var(--ad-basil)', fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label="Not ordered yet"
                      sx={{ mt: 0.75, bgcolor: 'var(--ad-bg-2)', color: 'text.secondary', fontWeight: 600 }}
                    />
                  )}

                  <Button
                    size="small"
                    fullWidth
                    disabled={busy === table.number}
                    onClick={() => handleFree(table)}
                    sx={{ mt: 1 }}
                  >
                    Clear table
                  </Button>
                </>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Free · {table.seats} seats
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default FloorBoard;
