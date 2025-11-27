import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Box,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getChefOrders, markOrderDelivered, updateChefOrderStatus } from '../../services/api';

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getChefOrders();
      console.log('📋 Chef Orders Response:', response.data);
      console.log('📊 Number of orders:', response.data.orders?.length || 0);
      
      // Log customizations for debugging
      if (response.data.orders && response.data.orders.length > 0) {
        response.data.orders.forEach((order, idx) => {
          console.log(`\n  📦 Order ${idx + 1}: ${order.orderNumber}`);
          order.items.forEach((item, itemIdx) => {
            console.log(`    🍽️ Item ${itemIdx + 1}: ${item.name} x${item.quantity}`);
            if (item.customizations && item.customizations.length > 0) {
              console.log(`      ✨ Customizations (${item.customizations.length}):`, item.customizations);
            } else {
              console.log(`      ℹ️  No customizations`);
            }
          });
        });
      }
      
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('Error details:', error.response?.data);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch orders',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      if (newStatus === 'delivered') {
        // Use the deliver endpoint for marking as delivered
        await markOrderDelivered(orderId);
      } else {
        // Use the status update endpoint for other status changes
        await updateChefOrderStatus(orderId, newStatus);
      }
      
      setSnackbar({
        open: true,
        message: `Order status updated to ${newStatus}`,
        severity: 'success',
      });
      
      // Refresh orders
      await fetchOrders();
    } catch (error) {
      console.error('❌ Error updating order:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update order',
        severity: 'error',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#6b7280';
      case 'confirmed':
        return '#3b82f6';
      case 'preparing':
        return '#f59e0b';
      case 'ready':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AccessTimeIcon />;
      case 'confirmed':
        return <CheckCircleIcon />;
      case 'preparing':
        return <RestaurantIcon />;
      case 'ready':
        return <LocalShippingIcon />;
      default:
        return <AccessTimeIcon />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <RestaurantIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Chef Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage confirmed orders and prepare dishes
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#6b7280', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {orders.filter(o => o.status === 'pending').length}
              </Typography>
              <Typography variant="body2">Pending Orders</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#3b82f6', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {orders.filter(o => o.status === 'confirmed').length}
              </Typography>
              <Typography variant="body2">Confirmed Orders</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#f59e0b', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {orders.filter(o => o.status === 'preparing').length}
              </Typography>
              <Typography variant="body2">Preparing</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: '#10b981', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700}>
                {orders.filter(o => o.status === 'ready').length}
              </Typography>
              <Typography variant="body2">Ready</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <RestaurantIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No active orders at the moment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Orders will appear here when customers place them
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order._id}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  border: `3px solid ${getStatusColor(order.status)}`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  {/* Order Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={order.status.toUpperCase()}
                      sx={{
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Customer Info */}
                  <Box mb={2}>
                    <Typography variant="body2" fontWeight={600}>
                      Customer: {order.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {order.customerPhone}
                    </Typography>
                  </Box>

                  {/* Order Type & Table */}
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={order.orderType === 'dine-in' ? 'Dine-In' : 'Takeaway'}
                      size="small"
                      color={order.orderType === 'dine-in' ? 'primary' : 'secondary'}
                    />
                    {order.orderType === 'dine-in' && order.tableNumber && (
                      <Chip
                        icon={<TableRestaurantIcon />}
                        label={`Table ${order.tableNumber}`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>

                  {/* Items */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Items ({order.items.length}):
                    </Typography>
                    {order.items.map((item, idx) => (
                      <Box key={idx} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={600}>
                            {item.quantity}x {item.name}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={600}>
                            ₹{item.price * item.quantity}
                          </Typography>
                        </Box>

                        {/* Customizations */}
                        {item.customizations && item.customizations.length > 0 && (
                          <Accordion sx={{ mt: 0.5, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="caption" color="primary" fontWeight={600}>
                                🎨 View Customizations ({item.customizations.length})
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {item.customizations.map((custom, cIdx) => (
                                <Box
                                  key={cIdx}
                                  sx={{
                                    mb: 1,
                                    p: 1,
                                    background: '#f9fafb',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                  }}
                                >
                                  <Typography variant="caption" fontWeight={700} color="primary">
                                    Item #{cIdx + 1}
                                  </Typography>
                                  {custom.spiceLevel && (
                                    <Typography variant="caption" display="block">
                                      🌶️ Spice: {custom.spiceLevel.toUpperCase()}
                                    </Typography>
                                  )}
                                  {custom.extras && custom.extras.length > 0 && (
                                    <Typography variant="caption" display="block">
                                      ➕ Extras: {custom.extras.map(e => e.replace('extra-', '').replace(/-/g, ' ')).join(', ')}
                                    </Typography>
                                  )}
                                  {custom.specialInstructions && (
                                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
                                      📝 Note: {custom.specialInstructions}
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

                  <Divider sx={{ mb: 2 }} />

                  {/* Total */}
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      Total:
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹{order.grandTotal.toFixed(2)}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={1} flexDirection="column">
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<RestaurantIcon />}
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                        disabled={updating === order._id}
                        sx={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          fontWeight: 700,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          },
                        }}
                      >
                        {updating === order._id ? <CircularProgress size={20} /> : 'Start Preparing'}
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<RestaurantIcon />}
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                        disabled={updating === order._id}
                        sx={{
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          fontWeight: 700,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          },
                        }}
                      >
                        {updating === order._id ? <CircularProgress size={20} /> : 'Start Preparing'}
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => updateOrderStatus(order._id, 'ready')}
                        disabled={updating === order._id}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          fontWeight: 700,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          },
                        }}
                      >
                        {updating === order._id ? <CircularProgress size={20} /> : 'Mark as Ready'}
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                        disabled={updating === order._id}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontWeight: 700,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          },
                        }}
                      >
                        {updating === order._id ? <CircularProgress size={20} /> : 'Mark as Delivered'}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChefDashboard;
