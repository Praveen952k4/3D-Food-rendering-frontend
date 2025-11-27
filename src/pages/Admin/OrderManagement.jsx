import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  TextField,
  Box,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getAdminOrders, updateAdminOrder } from '../../services/api';
import { format } from 'date-fns';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [updateType, setUpdateType] = useState(''); // 'status' or 'payment'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Filter orders based on search query
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerPhone?.includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getAdminOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    if (updateType === 'status' && !newStatus) return;
    if (updateType === 'payment' && !newPaymentStatus) return;

    try {
      const updateData = updateType === 'status' 
        ? { status: newStatus }
        : { paymentStatus: newPaymentStatus };
      
      await updateAdminOrder(selectedOrder._id, updateData);
      setSelectedOrder(null);
      setNewStatus('');
      setNewPaymentStatus('');
      setUpdateType('');
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      delivered: 'default',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get paginated data
  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        gap: '16px',
      }}>
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            size={60}
            thickness={4}
            sx={{
              color: '#667eea',
              animationDuration: '1.2s',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontSize: 28, color: '#667eea' }}>📦</Typography>
          </div>
        </div>
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
          Loading orders...
        </Typography>
      </div>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Order Management
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by order number, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No orders found matching your search' : 'No orders yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderNumber || order._id.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                  <Typography variant="body2">{order.customerName}</Typography>
                  <Typography variant="caption">{order.customerPhone}</Typography>
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
                <TableCell>₹{order.grandTotal.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.paymentStatus}
                    color={order.paymentStatus === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setUpdateType('status');
                      }}
                    >
                      Status
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewPaymentStatus(order.paymentStatus);
                        setUpdateType('payment');
                      }}
                    >
                      Payment
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>      <Dialog open={!!selectedOrder} onClose={() => {
        setSelectedOrder(null);
        setNewStatus('');
        setNewPaymentStatus('');
        setUpdateType('');
      }}>
        <DialogTitle>
          {updateType === 'status' ? 'Update Order Status' : 'Update Payment Status'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 300 }}>
          {updateType === 'status' ? (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Order Status</InputLabel>
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="preparing">Preparing</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment Status</InputLabel>
              <Select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value)}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="incomplete">Incomplete</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedOrder(null);
            setNewStatus('');
            setNewPaymentStatus('');
            setUpdateType('');
          }}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManagement;
