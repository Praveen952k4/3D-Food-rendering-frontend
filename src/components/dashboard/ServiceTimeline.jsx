import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
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
import {
  EventSeat,
  TableRestaurant,
  ReceiptLong,
  RoomService,
  SoupKitchen,
  DoneAll,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import io from 'socket.io-client';
import { getActivity } from 'services/api';
import { formatINR } from 'config/business';
import { FONT_DISPLAY } from 'theme/muiTheme';
import { SkeletonText } from 'components/ui/Loaders';

/**
 * Every step of a visit, with the time it happened and how long each handover
 * took: a table being taken, the order going in, staff picking it up, the
 * kitchen finishing, and the food reaching the table.
 *
 * New events arrive over the same socket the kitchen and customers already
 * use, so the feed fills in while the admin watches rather than on a refresh.
 */

const EVENT_STYLE = {
  'table-reserved': { icon: <EventSeat />, tone: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)' },
  'guest-checked-in': { icon: <TableRestaurant />, tone: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  'table-booked': { icon: <TableRestaurant />, tone: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  'order-placed': { icon: <ReceiptLong />, tone: 'var(--ad-saffron)', wash: 'var(--ad-saffron-wash)' },
  'order-accepted': { icon: <RoomService />, tone: 'var(--ad-saffron)', wash: 'var(--ad-saffron-wash)' },
  'order-preparing': { icon: <SoupKitchen />, tone: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)' },
  'order-ready': { icon: <DoneAll />, tone: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  'order-served': { icon: <DoneAll />, tone: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)' },
  'order-cancelled': { icon: <Cancel />, tone: 'var(--ad-text-3)', wash: 'var(--ad-bg-2)' },
};

const RANGES = [
  { value: 6, label: '6h' },
  { value: 24, label: 'Today' },
  { value: 72, label: '3 days' },
];

/** Older orders stored the table as "Table 5", newer ones as "5". */
const tableLabel = (number) => {
  if (!number) return 'Takeaway';
  const text = String(number).trim();
  return text.toLowerCase().startsWith('table') ? text : `Table ${text}`;
};

const clockOf = (value) => {
  if (!value) return '—';
  try {
    return format(typeof value === 'string' ? parseISO(value) : value, 'HH:mm');
  } catch {
    return '—';
  }
};

const agoOf = (value) => {
  if (!value) return '';
  try {
    return `${formatDistanceToNowStrict(typeof value === 'string' ? parseISO(value) : value)} ago`;
  } catch {
    return '';
  }
};

/** Minutes, or an em dash while that stage has not happened yet. */
const Mins = ({ value, warnOver }) => {
  if (value === null || value === undefined) {
    return <Typography component="span" variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>;
  }
  const late = warnOver !== undefined && value > warnOver;
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{ fontWeight: late ? 700 : 500, color: late ? 'var(--ad-ember)' : 'inherit' }}
    >
      {value} min
    </Typography>
  );
};

const Stat = ({ label, value }) => (
  <Box sx={{ minWidth: 104 }}>
    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
      {label}
    </Typography>
    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20 }}>
      {value === null || value === undefined ? '—' : `${value} min`}
    </Typography>
  </Box>
);

const ServiceTimeline = () => {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const socketRef = useRef(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getActivity(hours);
      setData(response.data);
      setLiveCount(0);
    } catch (error) {
      console.error('Failed to fetch the service timeline:', error);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // One socket for the panel. Each event is prepended as it arrives; the
  // per-order summary is refreshed alongside it, because its timings depend on
  // the stage this event may have just completed.
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('activity', (event) => {
      if (!event) return;
      setData((current) => {
        if (!current) return current;
        if (current.events.some((existing) => existing.id === event.id)) return current;
        return { ...current, events: [event, ...current.events].slice(0, 60) };
      });
      setLiveCount((n) => n + 1);
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const events = data?.events || [];
  const timeline = useMemo(
    () => (data?.timeline || []).filter((row) => row.status !== 'cancelled'),
    [data]
  );

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography className="ad-eyebrow">Service</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, mt: 0.5 }}>
            Table to table service timeline
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            When each table was taken, ordered, picked up by staff, cooked and served
            {data ? ` · ${data.tablesSeated} table${data.tablesSeated === 1 ? '' : 's'} seated` : ''}
          </Typography>
        </Box>

        <Box sx={{ ml: { sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
          {liveCount > 0 && (
            <Chip
              size="small"
              label={`${liveCount} new`}
              sx={{ bgcolor: 'var(--ad-ember-wash)', color: 'var(--ad-ember)', fontWeight: 700 }}
            />
          )}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={hours}
            onChange={(e, v) => v && setHours(v)}
            sx={{
              bgcolor: 'var(--ad-surface)',
              borderRadius: 'var(--ad-radius-sm)',
              p: 0.5,
              border: '1px solid var(--ad-line-strong)',
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '8px !important',
                px: 1.5,
                py: 0.25,
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
              <IconButton
                onClick={fetchActivity}
                disabled={loading}
                size="small"
                sx={{ border: '1px solid var(--ad-line-strong)' }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ---------------------------------------------- averages for the day */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 1 }}>
        <Stat label="Wait for staff" value={data?.averages?.waitToAccept} />
        <Stat label="In the kitchen" value={data?.averages?.timeInKitchen} />
        <Stat label="Ready to served" value={data?.averages?.waitToServe} />
        <Stat label="Order to table" value={data?.averages?.totalMinutes} />
        <Box sx={{ alignSelf: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Averages across {data?.averages?.servedOrders ?? 0} served order
            {data?.averages?.servedOrders === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {loading && !data ? (
        <SkeletonText lines={6} />
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' } }}>
          {/* ------------------------------------------ per-order stage times */}
          <Box sx={{ minWidth: 0, overflowX: 'auto' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              Each order, stage by stage
            </Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', py: 3 }}>
                No orders in this period yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Placed</TableCell>
                    <TableCell>Taken</TableCell>
                    <TableCell>Ready</TableCell>
                    <TableCell>Served</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeline.map((row) => (
                    <TableRow key={row.orderId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.orderNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {row.customerName} · {formatINR(row.grandTotal, false)}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.tableNumber ? tableLabel(row.tableNumber) : row.orderType}</TableCell>
                      <TableCell>{clockOf(row.placedAt)}</TableCell>
                      <TableCell>{clockOf(row.acceptedAt || row.cookingAt)}</TableCell>
                      <TableCell>
                        {clockOf(row.readyAt)}
                        {row.estimatedPrepMinutes > 0 && (
                          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                            est. {row.estimatedPrepMinutes} min
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{clockOf(row.servedAt)}</TableCell>
                      <TableCell align="right">
                        <Mins value={row.totalMinutes} warnOver={row.estimatedPrepMinutes || 30} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          {/* ----------------------------------------------------- event feed */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
              As it happened
            </Typography>
            {events.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', py: 3 }}>
                Nothing has happened in this period yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.25, maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                {events.map((event) => {
                  const style = EVENT_STYLE[event.key] || EVENT_STYLE['order-placed'];
                  return (
                    <Box
                      key={event.id}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        p: 1.25,
                        border: '1px solid var(--ad-line)',
                        borderRadius: 'var(--ad-radius-sm)',
                        bgcolor: 'var(--ad-surface)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '10px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: style.wash,
                          color: style.tone,
                          flex: 'none',
                          '& svg': { fontSize: 17 },
                        }}
                      >
                        {style.icon}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {event.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {tableLabel(event.tableNumber)}
                          {event.orderNumber ? ` · ${event.orderNumber}` : ''}
                          {event.customerName ? ` · ${event.customerName}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', flex: 'none' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {clockOf(event.at)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {agoOf(event.at)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ServiceTimeline;
