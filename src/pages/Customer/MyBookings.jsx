import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack, CheckCircle, Schedule, TableRestaurant } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import { getMyBookings, checkInBooking, cancelBooking } from '../../services/api';
import { useMessage } from '../../components/ui/MessageDialog';
import { SkeletonText } from '../../components/ui/Loaders';
import { formatINR } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/**
 * A customer's own reservations, and the one action that matters on the day:
 * checking in. That is the moment the table is actually taken and a pre-order
 * goes to the kitchen, so it is a button here rather than something that
 * happens silently at the booked time — a table nobody has arrived at should
 * stay available to everyone else.
 */

const TONE = {
  reserved: { label: 'Reserved', fg: 'var(--ad-saffron)', bg: 'var(--ad-saffron-wash)' },
  seated: { label: 'Checked in', fg: 'var(--ad-basil)', bg: 'var(--ad-basil-wash)' },
  completed: { label: 'Completed', fg: 'var(--ad-basil)', bg: 'var(--ad-basil-wash)' },
  cancelled: { label: 'Cancelled', fg: 'var(--ad-text-3)', bg: 'var(--ad-bg-2)' },
  'no-show': { label: 'Missed', fg: 'var(--ad-text-3)', bg: 'var(--ad-bg-2)' },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { showError, confirmAction } = useMessage();
  const [bookings, setBookings] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await getMyBookings();
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async (booking) => {
    setBusy(booking._id);
    try {
      const response = await checkInBooking(booking._id);
      await load();
      // A pre-order becomes a live order here, so say so — the kitchen has
      // already started by the time this returns.
      const order = response.data.order;
      await confirmAction({
        title: 'Checked in',
        message: order
          ? `Table ${booking.tableNumber} is yours. Your pre-order ${order.orderNumber} has gone to the kitchen.`
          : `Table ${booking.tableNumber} is yours. Order whenever you are ready.`,
        confirmLabel: 'Open the menu',
        cancelLabel: 'Stay here',
      }).then((open) => open && navigate('/customer/home'));
    } catch (err) {
      showError(err.response?.data?.message || 'Could not check you in.', { title: 'Not checked in' });
    } finally {
      setBusy('');
    }
  };

  const handleCancel = async (booking) => {
    const sure = await confirmAction({
      title: 'Cancel this booking?',
      message: `Table ${booking.tableNumber} on ${format(parseISO(booking.scheduledFor), 'EEEE d MMMM')} at ${format(parseISO(booking.scheduledFor), 'HH:mm')} will be released.`,
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!sure) return;

    setBusy(booking._id);
    try {
      await cancelBooking(booking._id);
      await load();
    } catch (err) {
      showError(err.response?.data?.message || 'Could not cancel that booking.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/customer/home')} sx={{ mb: 1 }}>
        The menu
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <Box>
          <Typography className="ad-eyebrow">Booking</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 26, sm: 32 } }}>
            My bookings
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/customer/book')} sx={{ ml: { sm: 'auto' } }}>
          Book another table
        </Button>
      </Box>

      {bookings === null ? (
        <SkeletonText lines={6} />
      ) : bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TableRestaurant sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, mb: 0.5 }}>
            No bookings yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
            Reserve a table and choose your food in advance.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/customer/book')}>
            Book a table
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {bookings.map((booking) => {
            const when = parseISO(booking.scheduledFor);
            const tone = TONE[booking.status] || TONE.reserved;
            const items = booking.preOrderItems || [];
            const total = items.reduce((sum, item) => sum + item.subtotal, 0);

            return (
              <Paper key={booking._id} sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19 }}>
                      Table {booking.tableNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {format(when, 'EEEE d MMMM, HH:mm')} · {booking.partySize}{' '}
                      {booking.partySize === 1 ? 'person' : 'people'}
                    </Typography>
                  </Box>
                  <Chip
                    label={tone.label}
                    size="small"
                    sx={{ bgcolor: tone.bg, color: tone.fg, fontWeight: 700 }}
                  />
                </Box>

                {items.length > 0 && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      borderRadius: 'var(--ad-radius-sm)',
                      bgcolor: 'var(--ad-bg-2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}>
                      Pre-ordered
                    </Typography>
                    {items.map((item) => (
                      <Typography key={item.name} variant="body2">
                        {item.quantity} × {item.name}
                      </Typography>
                    ))}
                    <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600 }}>
                      {formatINR(total, false)}
                      <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                        <Schedule sx={{ fontSize: 12, verticalAlign: 'text-bottom', mr: 0.25 }} />
                        ready about {booking.estimatedPrepMinutes} min after you check in
                      </Typography>
                    </Typography>
                  </Box>
                )}

                {booking.status === 'reserved' && (
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircle />}
                      disabled={busy === booking._id}
                      onClick={() => handleCheckIn(booking)}
                    >
                      I have arrived
                    </Button>
                    <Button
                      sx={{ color: 'text.secondary' }}
                      disabled={busy === booking._id}
                      onClick={() => handleCancel(booking)}
                    >
                      Cancel
                    </Button>
                    {isPast(when) && (
                      <Alert severity="warning" sx={{ py: 0, borderRadius: 'var(--ad-radius-sm)' }}>
                        This time has passed — check in or cancel.
                      </Alert>
                    )}
                  </Box>
                )}

                {booking.status === 'seated' && (
                  <Button sx={{ mt: 1.5, px: 0 }} onClick={() => navigate('/customer/home')}>
                    Order more from the menu
                  </Button>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default MyBookings;
