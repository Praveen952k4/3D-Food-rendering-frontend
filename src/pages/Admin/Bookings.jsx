import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh, CheckCircle, Cancel, EventBusy } from '@mui/icons-material';
import { format, parseISO, isPast } from 'date-fns';
import {
  getBookings,
  checkInBooking,
  cancelBooking,
  setBookingStatus,
} from 'services/api';
import { useMessage } from 'components/ui/MessageDialog';
import { SkeletonText } from 'components/ui/Loaders';
import { formatINR } from 'config/business';
import { FONT_DISPLAY } from 'theme/muiTheme';
import StatCard from 'components/dashboard/StatCard';
import FloorBoard from 'components/admin/FloorBoard';

/**
 * Every reservation, and the actions staff need on the day: seat a party that
 * has arrived, cancel one, or write off one that never turned up. Seating from
 * here does exactly what the customer's own check-in does — holds the table
 * and sends any pre-order to the kitchen — because somebody walking in without
 * their phone still needs to be seated.
 */

const TONE = {
  reserved: { label: 'Reserved', fg: 'var(--ad-saffron)', bg: 'var(--ad-saffron-wash)' },
  seated: { label: 'Checked in', fg: 'var(--ad-basil)', bg: 'var(--ad-basil-wash)' },
  completed: { label: 'Completed', fg: 'var(--ad-basil)', bg: 'var(--ad-basil-wash)' },
  cancelled: { label: 'Cancelled', fg: 'var(--ad-text-3)', bg: 'var(--ad-bg-2)' },
  'no-show': { label: 'No-show', fg: '#c5412f', bg: 'var(--ad-bg-2)' },
};

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
];

const AdminBookings = () => {
  const { showError, confirmAction } = useMessage();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBookings(days);
      setData(response.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setData({ bookings: [], counts: {} });
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (booking, what) => {
    setBusy(booking._id);
    try {
      if (what === 'seat') await checkInBooking(booking._id);
      if (what === 'cancel') await cancelBooking(booking._id);
      if (what === 'no-show') await setBookingStatus(booking._id, 'no-show');
      if (what === 'complete') await setBookingStatus(booking._id, 'completed');
      await load();
    } catch (err) {
      showError(err.response?.data?.message || 'That did not work.', { title: 'Booking unchanged' });
    } finally {
      setBusy('');
    }
  };

  const confirmThen = async (booking, what, title, message) => {
    const sure = await confirmAction({
      title,
      message,
      confirmLabel: title,
      cancelLabel: 'Keep it',
      destructive: what !== 'seat',
    });
    if (sure) act(booking, what);
  };

  const bookings = data?.bookings || [];
  const counts = data?.counts || {};

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Box>
          <Typography className="ad-eyebrow">Admin</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 28, sm: 36 }, mt: 0.5 }}>
            Bookings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Tables reserved in advance, and what each party pre-ordered
          </Typography>
        </Box>

        <Box sx={{ ml: { md: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={days}
            onChange={(e, v) => v && setDays(v)}
            sx={{
              bgcolor: 'var(--ad-surface)',
              borderRadius: 'var(--ad-radius-sm)',
              p: 0.5,
              border: '1px solid var(--ad-line-strong)',
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '8px !important',
                px: 1.75,
                py: 0.5,
                fontSize: 12.5,
                fontWeight: 600,
                color: 'text.disabled',
              },
              '& .Mui-selected': { bgcolor: 'var(--ad-ember) !important', color: '#fff !important' },
            }}
          >
            {RANGES.map((r) => (
              <ToggleButton key={r.value} value={r.value}>
                {r.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={load} disabled={loading} sx={{ border: '1px solid var(--ad-line-strong)' }}>
                <Refresh fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, mb: 3 }}>
        <StatCard title="Expected" value={counts.reserved ?? 0} hint="Not arrived yet" tone="saffron" loading={loading} />
        <StatCard title="Checked in" value={counts.seated ?? 0} hint="Sitting down now" tone="basil" loading={loading} />
        <StatCard title="Cancelled" value={counts.cancelled ?? 0} hint="Including no-shows" tone="ember" loading={loading} />
      </Box>

      <Box sx={{ mb: 3 }}>
        <FloorBoard />
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {loading && !data ? (
          <SkeletonText lines={6} />
        ) : bookings.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
            No bookings in this period.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Party</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Pre-order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => {
                  const when = parseISO(booking.scheduledFor);
                  const tone = TONE[booking.status] || TONE.reserved;
                  const items = booking.preOrderItems || [];
                  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
                  const late = booking.status === 'reserved' && isPast(when);

                  return (
                    <TableRow key={booking._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {format(when, 'HH:mm')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: late ? 'var(--ad-ember)' : 'text.disabled' }}>
                          {format(when, 'EEE d MMM')}
                          {late ? ' · overdue' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{booking.tableNumber}</TableCell>
                      <TableCell>{booking.partySize}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.customerName || '—'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {booking.customerPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {items.length === 0 ? (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            Ordering at the table
                          </Typography>
                        ) : (
                          <>
                            <Typography variant="body2">
                              {items.reduce((sum, i) => sum + i.quantity, 0)} items ·{' '}
                              {formatINR(total, false)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              about {booking.estimatedPrepMinutes} min to cook
                            </Typography>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tone.label}
                          size="small"
                          sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {booking.status === 'reserved' && (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Seat this party now">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy === booking._id}
                                  onClick={() =>
                                    confirmThen(
                                      booking,
                                      'seat',
                                      'Seat them',
                                      `Table ${booking.tableNumber} will be held${items.length ? ' and their pre-order goes to the kitchen now.' : '.'}`
                                    )
                                  }
                                >
                                  <CheckCircle fontSize="small" sx={{ color: 'var(--ad-basil)' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="They never arrived">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy === booking._id}
                                  onClick={() =>
                                    confirmThen(
                                      booking,
                                      'no-show',
                                      'Mark no-show',
                                      `Table ${booking.tableNumber} will be released for other guests.`
                                    )
                                  }
                                >
                                  <EventBusy fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Cancel this booking">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy === booking._id}
                                  onClick={() =>
                                    confirmThen(
                                      booking,
                                      'cancel',
                                      'Cancel booking',
                                      `Table ${booking.tableNumber} will be released.`
                                    )
                                  }
                                >
                                  <Cancel fontSize="small" sx={{ color: '#c5412f' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                        {booking.status === 'seated' && (
                          <Button
                            size="small"
                            disabled={busy === booking._id}
                            onClick={() =>
                              confirmThen(
                                booking,
                                'complete',
                                'Mark completed',
                                `Table ${booking.tableNumber} will be released for the next guests.`
                              )
                            }
                          >
                            Finish
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminBookings;
