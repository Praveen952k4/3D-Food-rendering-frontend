import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  Divider,
  Stack,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ArrowBack,
  Restaurant,
  Schedule,
  Payment,
  LocationOn,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getOrderHistory, submitFeedback } from '../../services/api';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        navigate('/login');
        return;
      }

      const response = await getOrderHistory(phone);
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch order history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = (order) => {
    setSelectedOrder(order);
    setRating(order.rating || 0);
    setFeedback(order.customerFeedback || '');
    setFeedbackDialogOpen(true);
  };

  const handleCloseFeedback = () => {
    setFeedbackDialogOpen(false);
    setSelectedOrder(null);
    setRating(0);
    setFeedback('');
  };

  const handleSubmitFeedback = async () => {
    if (!selectedOrder || rating === 0) return;

    try {
      setSubmittingFeedback(true);
      const response = await submitFeedback(selectedOrder._id, rating, feedback);
      if (response.data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === selectedOrder._id
              ? { ...order, rating, customerFeedback: feedback, feedbackDate: new Date().toISOString() }
              : order
          )
        );
        handleCloseFeedback();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
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
            <Restaurant style={{ fontSize: 28, color: '#667eea' }} />
          </div>
        </div>
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
          Loading your orders...
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/customer/home')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            Order History
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {orders.length === 0 ? (
          <Card sx={{ mt: 4, textAlign: 'center', py: 6 }}>
            <Restaurant sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Orders Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start ordering to see your order history
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/customer/home')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Browse Menu
            </Button>
          </Card>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => (
              <Card key={order._id} sx={{ boxShadow: 2 }}>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Schedule sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        {formatDate(order.createdAt)}
                      </Typography>
                    </div>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </div>

                  <Divider sx={{ mb: 2 }} />

                  <div style={{ marginBottom: '16px' }}>
                    {order.items.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Typography variant="body2">
                          {item.name} x {item.quantity}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{item.subtotal}
                        </Typography>
                      </div>
                    ))}
                  </div>

                  <Divider sx={{ mb: 2 }} />

                  <div style={{ marginBottom: '16px' }}>
                    <Typography variant="body2" color="text.secondary">
                      <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {order.orderType === 'dine-in'
                        ? `Dine-in • Table ${order.tableNumber}`
                        : 'Takeaway'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <Payment sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      {order.paymentMethod.toUpperCase()} • {order.paymentStatus.toUpperCase()}
                    </Typography>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ₹{order.grandTotal}
                    </Typography>
                  </div>

                  {order.status === 'delivered' && (
                    <>
                      <Divider sx={{ mb: 2 }} />
                      {order.rating ? (
                        <div>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Your Feedback
                          </Typography>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <Rating value={order.rating} readOnly size="small" />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                              ({order.rating}/5)
                            </Typography>
                          </div>
                          {order.customerFeedback && (
                            <Typography variant="body2" color="text.secondary">
                              "{order.customerFeedback}"
                            </Typography>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Star />}
                          onClick={() => handleOpenFeedback(order)}
                          fullWidth
                        >
                          Rate Your Experience
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Container>

      <Dialog open={feedbackDialogOpen} onClose={handleCloseFeedback} maxWidth="sm" fullWidth>
        <DialogTitle>Rate Your Experience</DialogTitle>
        <DialogContent>
          <div style={{ paddingTop: '16px', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order: {selectedOrder?.orderNumber}
            </Typography>
            <div style={{ margin: '24px 0' }}>
              <Typography variant="body1" gutterBottom>
                How would you rate your food?
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
                size="large"
                sx={{ fontSize: 48 }}
              />
            </div>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Share your experience... (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              variant="outlined"
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseFeedback} disabled={submittingFeedback}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={rating === 0 || submittingFeedback}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submittingFeedback ? <CircularProgress size={24} /> : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
