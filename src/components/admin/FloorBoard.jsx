import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { AcUnit, Refresh, TableRestaurant } from '@mui/icons-material';
import io from 'socket.io-client';
import { getFloorTables, freeTable, setTableFrozen } from 'services/api';
import { useMessage } from 'components/ui/MessageDialog';
import { SkeletonText } from 'components/ui/Loaders';
import { FONT_DISPLAY } from 'theme/muiTheme';

/**
 * The floor as it stands: which tables are free, which are taken, how long
 * each party has been sitting, and which of them have eaten and could leave.
 *
 * Tables free themselves — when the party says they are going, when they
 * leave a review, or when housekeeping finds one quiet since its last course
 * — so the clear button here is for the cases that beat the clock: a party
 * that has plainly gone, or a table being turned over for someone waiting.
 *
 * Freezing is the other direction: a table nobody should be seated at, for
 * reasons the floor knows nothing about — a broken leg, a leak above it, a
 * corner being set up for later. It leaves the guest door entirely until it
 * is put back.
 */

/** The ways staff look at the floor: everything, or one side of it. */
const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'free', label: 'Free' },
  { key: 'taken', label: 'Taken' },
  { key: 'frozen', label: 'Frozen' },
];

const EMPTY_VIEW = {
  free: 'No table is free right now.',
  taken: 'Nobody is seated.',
  frozen: 'Every table is in service.',
  all: 'No tables have been set up yet.',
};

const FloorBoard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [view, setView] = useState('all');
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

  const handleFreeze = async (table) => {
    const freezing = !table.isFrozen;
    if (freezing) {
      const sure = await confirmAction({
        title: `Freeze table ${table.number}?`,
        message: 'Nobody will be seated here, and it disappears from the guest door, until you put it back.',
        confirmLabel: 'Freeze it',
        cancelLabel: 'Leave it',
      });
      if (!sure) return;
    }

    setBusy(table.number);
    try {
      await setTableFrozen(table.number, freezing);
      await load();
    } catch (err) {
      showError(err.response?.data?.message || 'Could not change that table.');
    } finally {
      setBusy('');
    }
  };

  const tables = useMemo(() => data?.tables || [], [data]);
  const settings = data?.settings || {};
  const taken = tables.filter((table) => table.isOccupied).length;
  const frozen = tables.filter((table) => table.isFrozen).length;
  const free = tables.length - taken - frozen;

  const countFor = (key) =>
    key === 'free' ? free : key === 'taken' ? taken : key === 'frozen' ? frozen : tables.length;

  const shown = useMemo(() => {
    if (view === 'free') return tables.filter((table) => !table.isOccupied && !table.isFrozen);
    if (view === 'taken') return tables.filter((table) => table.isOccupied);
    if (view === 'frozen') return tables.filter((table) => table.isFrozen);
    return tables;
  }, [tables, view]);

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography className="ad-eyebrow">Floor</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mt: 0.5 }}>
            Who is sitting where
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {data
              ? `${free} free · ${taken} taken${frozen ? ` · ${frozen} frozen` : ''} of ${tables.length} tables`
              : 'Loading the floor'}
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

      {/* Someone on the door is only ever asking one of these questions. */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
        {VIEWS.map((option) => {
          const active = view === option.key;
          return (
            <Chip
              key={option.key}
              size="small"
              clickable
              onClick={() => setView(option.key)}
              label={`${option.label} · ${countFor(option.key)}`}
              sx={{
                fontWeight: 600,
                bgcolor: active ? 'var(--ad-ember)' : 'var(--ad-bg-2)',
                color: active ? '#fff' : 'text.secondary',
                '&:hover': { bgcolor: active ? 'var(--ad-ember)' : 'var(--ad-bg-2)', opacity: 0.9 },
              }}
            />
          );
        })}
      </Box>

      {loading && !data ? (
        <SkeletonText lines={4} />
      ) : shown.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
          {EMPTY_VIEW[view]}
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          }}
        >
          {shown.map((table) => (
            <Box
              key={table.number}
              sx={{
                p: 1.5,
                borderRadius: 'var(--ad-radius-sm)',
                border: '1px solid',
                borderStyle: table.isFrozen ? 'dashed' : 'solid',
                borderColor: table.isOccupied ? 'var(--ad-ember)' : 'var(--ad-line)',
                bgcolor: table.isOccupied
                  ? 'var(--ad-ember-wash)'
                  : table.isFrozen
                  ? 'var(--ad-bg-2)'
                  : 'var(--ad-surface)',
                opacity: table.isFrozen ? 0.75 : 1,
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
                    {busy === table.number ? 'Clearing…' : 'Clear table'}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
                    {table.isFrozen ? 'Out of service' : 'Free'} · {table.seats} seats
                  </Typography>

                  {table.isFrozen && (
                    <Chip
                      size="small"
                      icon={<AcUnit sx={{ fontSize: 13 }} />}
                      label="Frozen"
                      sx={{ mt: 0.75, bgcolor: 'var(--ad-bg-2)', color: 'text.secondary', fontWeight: 600 }}
                    />
                  )}

                  <Button
                    size="small"
                    fullWidth
                    disabled={busy === table.number}
                    onClick={() => handleFreeze(table)}
                    sx={{ mt: 1 }}
                  >
                    {busy === table.number
                      ? 'Working…'
                      : table.isFrozen
                      ? 'Put back in service'
                      : 'Freeze table'}
                  </Button>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default FloorBoard;
