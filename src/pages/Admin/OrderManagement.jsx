import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { format } from 'date-fns';
import { getAdminOrders, updateAdminOrder } from '../../services/api';
import ReceiptDialog from '../../components/admin/ReceiptDialog';
import { SkeletonCards } from '../../components/ui/Loaders';
import { formatINR, gstForOrder } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const PER_PAGE = 12;

const STATUS_TONE = {
  pending: { bg: 'var(--ad-saffron-wash)', fg: 'var(--ad-warn)' },
  confirmed: { bg: 'var(--ad-saffron-wash)', fg: 'var(--ad-warn)' },
  preparing: { bg: 'var(--ad-ember-wash)', fg: 'var(--ad-ember)' },
  ready: { bg: 'var(--ad-basil-wash)', fg: 'var(--ad-basil)' },
  delivered: { bg: 'var(--ad-basil-wash)', fg: 'var(--ad-basil)' },
  cancelled: { bg: 'var(--ad-bg-2)', fg: 'var(--ad-text-3)' },
};

const PAID = ['success', 'completed'];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'In kitchen' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'unpaid', label: 'Unpaid' },
];

/** One order, as a tile. */
const OrderTile = ({ order, onStatus, onPayment, onReceipt }) => {
  const tone = STATUS_TONE[order.status] || STATUS_TONE.cancelled;
  const gst = gstForOrder(order);
  const paid = PAID.includes(order.paymentStatus);

  return (
    <Paper
      sx={{
        p: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: '100%',
        transition: 'transform .2s ease, border-color .2s ease',
        '&:hover': { transform: 'translateY(-2px)', borderColor: 'var(--ad-line-strong)' },
      }}
    >
      {/* head */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 17 }} noWrap>
            {order.orderNumber || order._id.slice(-6)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {format(new Date(order.createdAt), 'dd MMM yyyy · HH:mm')}
          </Typography>
        </Box>
        <Chip
          label={order.status}
          size="small"
          sx={{
            ml: 'auto',
            bgcolor: tone.bg,
            color: tone.fg,
            textTransform: 'capitalize',
            flex: 'none',
          }}
        />
      </Box>

      {/* customer + service */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {order.customerName || 'Guest'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {order.customerPhone}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          icon={order.orderType === 'dine-in' ? <TableRestaurantIcon /> : <ShoppingBagIcon />}
          label={
            order.orderType === 'dine-in'
              ? `Table ${order.tableNumber || '—'}`
              : 'Takeaway'
          }
          sx={{ ml: 'auto', flex: 'none', '& .MuiChip-icon': { fontSize: 14 } }}
        />
      </Box>

      {/* items */}
      <Box
        sx={{
          bgcolor: 'var(--ad-bg-2)',
          border: '1px solid var(--ad-line)',
          borderRadius: 'var(--ad-radius-sm)',
          px: 1.5,
          py: 1.25,
          display: 'grid',
          gap: 0.5,
        }}
      >
        {order.items.slice(0, 3).map((item, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, fontSize: 13 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, minWidth: 0 }} noWrap>
              {item.quantity} × {item.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', flex: 'none' }}>
              {formatINR(item.subtotal, false)}
            </Typography>
          </Box>
        ))}
        {order.items.length > 3 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* money */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 'auto' }}>
        <Box>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 21, fontWeight: 600, color: 'var(--ad-ember)' }}>
            {formatINR(order.grandTotal)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            incl. {formatINR(gst.total)} GST
          </Typography>
        </Box>
        <Chip
          label={order.paymentStatus}
          size="small"
          sx={{
            ml: 'auto',
            textTransform: 'capitalize',
            bgcolor: paid ? 'var(--ad-basil-wash)' : 'var(--ad-ember-wash)',
            color: paid ? 'var(--ad-basil)' : 'var(--ad-ember)',
          }}
        />
      </Box>

      {/* actions */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', borderTop: '1px solid var(--ad-line)', pt: 1.5 }}>
        <Button size="small" variant="outlined" onClick={() => onStatus(order)} sx={{ flex: '1 1 auto' }}>
          Status
        </Button>
        <Button size="small" variant="outlined" color="secondary" onClick={() => onPayment(order)} sx={{ flex: '1 1 auto' }}>
          Payment
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<ReceiptLongIcon />}
          onClick={() => onReceipt(order)}
          sx={{ flex: '1 1 auto' }}
        >
          Receipt
        </Button>
      </Box>
    </Paper>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateType, setUpdateType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAdminOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Could not load orders. Check that the API is reachable, then retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (
        query &&
        !(
          order.orderNumber?.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerPhone?.includes(query)
        )
      ) {
        return false;
      }
      if (filter === 'active') return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
      if (filter === 'delivered') return order.status === 'delivered';
      if (filter === 'unpaid') return !PAID.includes(order.paymentStatus);
      return true;
    });
  }, [orders, searchQuery, filter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filter]);

  const pageCount = Math.max(Math.ceil(filteredOrders.length / PER_PAGE), 1);
  const pageOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const closeDialog = () => {
    setSelectedOrder(null);
    setUpdateType('');
    setNewStatus('');
    setNewPaymentStatus('');
  };

  const handleUpdate = async () => {
    if (!selectedOrder) return;
    const payload = updateType === 'status' ? { status: newStatus } : { paymentStatus: newPaymentStatus };
    if (!Object.values(payload)[0]) return;

    setSaving(true);
    try {
      await updateAdminOrder(selectedOrder._id, payload);
      closeDialog();
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order:', err);
      setError('The order could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography className="ad-eyebrow">Admin</Typography>
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: { xs: 28, sm: 36 }, mt: 0.5 }}>
          Order management
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {loading
            ? 'Loading orders…'
            : `${filteredOrders.length} of ${orders.length} order${orders.length === 1 ? '' : 's'}`}
        </Typography>
      </Box>

      {/* filters */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search order number, name or phone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: '1 1 280px', maxWidth: 440 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(e, v) => v && setFilter(v)}
          sx={{
            bgcolor: 'var(--ad-surface)',
            borderRadius: 999,
            p: 0.5,
            border: '1px solid var(--ad-line-strong)',
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              border: 0,
              borderRadius: '999px !important',
              px: 1.75,
              py: 0.5,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'text.disabled',
            },
            '& .Mui-selected': { bgcolor: 'var(--ad-ember) !important', color: '#fff !important' },
          }}
        >
          {FILTERS.map((f) => (
            <ToggleButton key={f.value} value={f.value}>
              {f.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchOrders}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* tiles */}
      {loading ? (
        <SkeletonCards count={6} height={230} columns="repeat(auto-fill, minmax(290px, 1fr))" />
      ) : pageOrders.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            color: 'text.disabled',
            border: '1px dashed var(--ad-line-strong)',
          }}
        >
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 20, mb: 0.5, color: 'text.secondary' }}>
            Nothing here
          </Typography>
          <Typography variant="body2">
            {searchQuery || filter !== 'all'
              ? 'No orders match this search or filter.'
              : 'No orders have been placed yet.'}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 2.5,
            alignItems: 'stretch',
          }}
        >
          {pageOrders.map((order) => (
            <OrderTile
              key={order._id}
              order={order}
              onReceipt={setReceiptOrder}
              onStatus={(o) => {
                setSelectedOrder(o);
                setNewStatus(o.status);
                setUpdateType('status');
              }}
              onPayment={(o) => {
                setSelectedOrder(o);
                setNewPaymentStatus(o.paymentStatus);
                setUpdateType('payment');
              }}
            />
          ))}
        </Box>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, v) => setPage(v)}
            shape="rounded"
            color="primary"
          />
        </Box>
      )}

      {/* status / payment dialog */}
      <Dialog open={!!selectedOrder} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{updateType === 'status' ? 'Update order status' : 'Update payment status'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {selectedOrder?.orderNumber} · {selectedOrder?.customerName}
          </Typography>
          {updateType === 'status' ? (
            <FormControl fullWidth>
              <InputLabel>Order status</InputLabel>
              <Select label="Order status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Payment status</InputLabel>
              <Select
                label="Payment status"
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
              >
                {['pending', 'incomplete', 'completed', 'failed'].map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <ReceiptDialog order={receiptOrder} open={!!receiptOrder} onClose={() => setReceiptOrder(null)} />
    </Container>
  );
};

export default OrderManagement;
