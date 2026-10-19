import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getChefOrders, markOrderDelivered, updateChefOrderStatus } from '../../services/api';
import { SkeletonCards, LoadingNote } from '../../components/ui/Loaders';
import { formatINR } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';

/** Ticket states, in the order a dish moves through the kitchen. */
const STATES = {
  pending: { label: 'Pending', fg: 'var(--ad-text-3)', wash: 'var(--ad-bg-2)', icon: <AccessTimeIcon /> },
  confirmed: { label: 'Confirmed', fg: 'var(--ad-saffron)', wash: 'var(--ad-saffron-wash)', icon: <CheckCircleIcon /> },
  preparing: { label: 'Preparing', fg: 'var(--ad-ember)', wash: 'var(--ad-ember-wash)', icon: <RestaurantIcon /> },
  ready: { label: 'Ready', fg: 'var(--ad-basil)', wash: 'var(--ad-basil-wash)', icon: <LocalShippingIcon /> },
};

const COUNTERS = ['pending', 'confirmed', 'preparing', 'ready'];

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const firstLoad = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await getChefOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching chef orders:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not reach the kitchen board.',
        severity: 'error',
      });
    } finally {
      firstLoad.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      if (newStatus === 'delivered') await markOrderDelivered(orderId);
      else await updateChefOrderStatus(orderId, newStatus);

      setSnackbar({ open: true, message: `Order marked ${newStatus}.`, severity: 'success' });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Could not update the order.',
        severity: 'error',
      });
    } finally {
      setUpdating(null);
    }
  };

  /** The one action that makes sense for a ticket in this state. */
  const nextStep = (order) => {
    if (order.status === 'pending' || order.status === 'confirmed') {
      return { status: 'preparing', label: 'Start preparing', icon: <RestaurantIcon /> };
    }
    if (order.status === 'preparing') {
      return { status: 'ready', label: 'Mark as ready', icon: <CheckCircleIcon /> };
    }
    if (order.status === 'ready') {
      return { status: 'delivered', label: 'Mark as delivered', icon: <LocalShippingIcon /> };
    }
    return null;
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography className="ad-eyebrow">Kitchen</Typography>
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 28, sm: 36 }, mt: 0.5 }}>
          Live order board
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Tickets refresh every 10 seconds. Work left to right: confirmed → preparing → ready.
        </Typography>
      </Box>

      {/* counters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {COUNTERS.map((key) => {
          const state = STATES[key];
          const count = orders.filter((o) => o.status === key).length;
          return (
            <Grid item xs={6} md={3} key={key}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: state.wash,
                    color: state.fg,
                    flex: 'none',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {state.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>
                    {loading ? '—' : count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {state.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* tickets */}
      {loading ? (
        <SkeletonCards count={6} height={260} columns="repeat(auto-fill, minmax(320px, 1fr))" />
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed var(--ad-line-strong)' }}>
          <RestaurantIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 21, mb: 0.5 }}>The pass is clear</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            New tickets appear here the moment a guest places an order.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2.5 }}>
          {orders.map((order) => {
            const state = STATES[order.status] || STATES.pending;
            const step = nextStep(order);
            const busy = updating === order._id;

            return (
              <Paper
                key={order._id}
                sx={{
                  p: 2.25,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    insetInlineStart: 0,
                    insetBlock: 0,
                    width: 4,
                    bgcolor: state.fg,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pl: 0.75 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17 }} noWrap>
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Chip
                    icon={state.icon}
                    label={state.label}
                    size="small"
                    sx={{
                      ml: 'auto',
                      flex: 'none',
                      bgcolor: state.wash,
                      color: state.fg,
                      '& .MuiChip-icon': { color: 'inherit', fontSize: 15 },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', pl: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {order.customerName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {order.customerPhone}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={order.orderType === 'dine-in' ? <TableRestaurantIcon /> : <ShoppingBagIcon />}
                    label={order.orderType === 'dine-in' ? `Table ${order.tableNumber || '—'}` : 'Takeaway'}
                    sx={{ ml: 'auto', flex: 'none', '& .MuiChip-icon': { fontSize: 14 } }}
                  />
                </Box>

                <Divider />

                {/* items */}
                <Box sx={{ pl: 0.75 }}>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: 'text.disabled',
                      mb: 1,
                    }}
                  >
                    {order.items.length} item{order.items.length === 1 ? '' : 's'}
                  </Typography>

                  {order.items.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }}>
                          <Box component="span" sx={{ color: 'var(--ad-ember)', mr: 0.75 }}>
                            {item.quantity}×
                          </Box>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', flex: 'none' }}>
                          {formatINR(item.price * item.quantity, false)}
                        </Typography>
                      </Box>

                      {item.customizations?.length > 0 && (
                        <Accordion
                          disableGutters
                          sx={{
                            mt: 0.75,
                            boxShadow: 'none',
                            border: '1px solid var(--ad-line)',
                            borderRadius: 'var(--ad-radius-sm)',
                            bgcolor: 'var(--ad-bg-2)',
                            '&::before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 36 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--ad-ember)' }}>
                              Customisations ({item.customizations.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0 }}>
                            {item.customizations.map((custom, cIdx) => (
                              <Box
                                key={cIdx}
                                sx={{
                                  mb: 1,
                                  p: 1,
                                  bgcolor: 'var(--ad-surface)',
                                  borderRadius: 'var(--ad-radius-sm)',
                                  border: '1px solid var(--ad-line)',
                                }}
                              >
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>
                                  Portion {cIdx + 1}
                                </Typography>
                                {custom.spiceLevel && (
                                  <Typography variant="caption" display="block">
                                    Spice: {custom.spiceLevel}
                                  </Typography>
                                )}
                                {custom.extras?.length > 0 && (
                                  <Typography variant="caption" display="block">
                                    Extras: {custom.extras.map((e) => e.replace('extra-', '').replace(/-/g, ' ')).join(', ')}
                                  </Typography>
                                )}
                                {custom.specialInstructions && (
                                  <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', color: 'var(--ad-ember)' }}>
                                    “{custom.specialInstructions}”
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  ))}
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'baseline', pl: 0.75 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total
                  </Typography>
                  <Typography
                    sx={{ ml: 'auto', fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: 'var(--ad-ember)' }}
                  >
                    {formatINR(order.grandTotal)}
                  </Typography>
                </Box>

                {step && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={busy ? null : step.icon}
                    onClick={() => updateOrderStatus(order._id, step.status)}
                    disabled={busy}
                    sx={{ mt: 'auto' }}
                  >
                    {busy ? (
                      <>
                        <span className="ad-spinner" style={{ marginRight: 8 }} aria-hidden="true" />
                        Updating…
                      </>
                    ) : (
                      step.label
                    )}
                  </Button>
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      {refreshing && !loading && <LoadingNote>Checking for new tickets…</LoadingNote>}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 'var(--ad-radius)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChefDashboard;
