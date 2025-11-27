import React, { useEffect, useState, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { getActiveOrders, submitDetailedFeedback, getFeedbackByOrder } from '../services/api';
import io from 'socket.io-client';

const statusConfig = {
  pending: {
    label: 'Order Placed',
    color: '#fbbf24',
    icon: <HourglassEmptyIcon />,
    progress: 20,
    bg: '#fef3c7',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#3b82f6',
    icon: <CheckCircleIcon />,
    progress: 40,
    bg: '#dbeafe',
  },
  preparing: {
    label: 'Preparing',
    color: '#f59e0b',
    icon: <RestaurantIcon />,
    progress: 60,
    bg: '#fed7aa',
  },
  ready: {
    label: 'Ready',
    color: '#10b981',
    icon: <LocalShippingIcon />,
    progress: 80,
    bg: '#d1fae5',
  },
  delivered: {
    label: 'Delivered',
    color: '#059669',
    icon: <CheckCircleIcon />,
    progress: 100,
    bg: '#a7f3d0',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    icon: <CancelIcon />,
    progress: 0,
    bg: '#fee2e2',
  },
};

const OrderNotifications = ({ onCountChange, onUnviewedCountChange, showInDrawer = false, onOrderDelivered, isDrawerOpen }) => {
  const [orders, setOrders] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [expanded, setExpanded] = useState({});
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shopRating, setShopRating] = useState(5);
  const [shopFeedback, setShopFeedback] = useState('');
  const [itemRatings, setItemRatings] = useState({});
  const [itemComments, setItemComments] = useState({});
  const [serviceQuality, setServiceQuality] = useState(5);
  const [deliverySpeed, setDeliverySpeed] = useState(5);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const previousOrdersRef = useRef({});
  const audioRef = useRef(null);
  const socketRef = useRef(null);

  // Load notification history and viewed state from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('notificationHistory');
    const savedViewed = localStorage.getItem('viewedNotifications');
    
    if (savedHistory) {
      try {
        setNotificationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading notification history:', e);
      }
    }
    
    if (savedViewed) {
      try {
        setViewedNotifications(new Set(JSON.parse(savedViewed)));
      } catch (e) {
        console.error('Error loading viewed notifications:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No authentication token found');
      return;
    }

    // Decode token to get user ID
    let userId;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      userId = tokenPayload.id;
      console.log('👤 User ID from token:', userId);
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return;
    }
    
    console.log('🚀 OrderNotifications component mounted');
    
    // Initialize Socket.IO connection
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketRef.current.id);
      // Join user's notification room
      socketRef.current.emit('join', userId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    // Listen for order updates via Socket.IO
    socketRef.current.on('orderUpdate', (data) => {
      console.log('🔔 Received order update via Socket.IO:', data);
      
      const { type, order, message, newStatus } = data;
      
      if (type === 'created') {
        // New order placed
        playNotificationSound();
        showNotification(message || `Order ${order.orderNumber} placed successfully!`, 'success');
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Placed! 🎉', {
            body: message || `Order ${order.orderNumber} has been placed`,
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        }
      } else if (type === 'statusChange') {
        // Order status changed
        const config = statusConfig[newStatus];
        playNotificationSound();
        showNotification(
          message || `Order ${order.orderNumber} is now ${config?.label || newStatus}!`,
          getNotificationSeverity(newStatus)
        );
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Update 📦', {
            body: `Order ${order.orderNumber} is now ${config?.label || newStatus}`,
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        }

        // Check for delivered orders for feedback
        if (newStatus === 'delivered' && !order.hasFeedback) {
          const shownFeedback = sessionStorage.getItem(`feedback_shown_${order._id}`);
          if (!shownFeedback && onOrderDelivered) {
            console.log(`📝 Triggering feedback overlay for order ${order.orderNumber}`);
            sessionStorage.setItem(`feedback_shown_${order._id}`, 'true');
            setTimeout(() => {
              onOrderDelivered(order);
            }, 1000);
          }
        }
      }
      
      // Refresh orders list
      fetchActiveOrders();
    });

    fetchActiveOrders();
    
    // Initialize audio
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSp+zPLTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSl6yvLZiToHHGa67OihUBELTKXh8bllHAU2jdXxxXwrBSF1xe/glEcOC1Wt6O+zYBoGPJPY8sZ0KwUme8rx14k6Bxlju+zjn1ARCUuh4PK8aB8GM4/W8cd+KgUgdMXv4JVIDQtUrejvs2EaBj2U2fLHdiwFJ33N8deMOwYYYbzs45lPEQlLouDyvGkfBTOQ1vHHfyoFH3TF7+CVSQwLU63o77NiGgY+ldny');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
    
    // Listen for order placed event (fallback for immediate UI update)
    const handleOrderPlaced = (event) => {
      console.log('🆕 New order placed event:', event.detail);
      fetchActiveOrders();
    };
    
    window.addEventListener('orderPlaced', handleOrderPlaced);
    
    // Still poll every 10 seconds as backup (reduced frequency since we have real-time updates)
    const interval = setInterval(fetchActiveOrders, 10000);
    
    return () => {
      console.log('🛑 OrderNotifications component unmounted');
      clearInterval(interval);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Mark all current notifications as viewed when drawer opens
  useEffect(() => {
    if (isDrawerOpen && orders.length > 0) {
      const newViewed = new Set(viewedNotifications);
      let hasNewViews = false;
      
      // Only mark CURRENT active orders as viewed
      orders.forEach(order => {
        if (!newViewed.has(order._id)) {
          newViewed.add(order._id);
          hasNewViews = true;
        }
      });
      
      if (hasNewViews) {
        setViewedNotifications(newViewed);
        localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(newViewed)));
        
        // Update unviewed count to 0 since we just viewed all current orders
        if (onUnviewedCountChange) {
          onUnviewedCountChange(0);
        }
      }
    }
  }, [isDrawerOpen]); // Only depend on isDrawerOpen, not orders

  const fetchActiveOrders = async () => {
    try {
      console.log('🔍 Fetching active orders...');
      const response = await getActiveOrders();
      console.log('📦 Active orders response:', response.data);
      
      if (response.data.success) {
        const newOrders = response.data.orders;
        console.log(`✅ Found ${newOrders.length} active orders`);
        
        // Update notification history - merge new orders with existing history
        const updatedHistory = [...notificationHistory];
        let historyChanged = false;
        
        newOrders.forEach(order => {
          const existingIndex = updatedHistory.findIndex(h => h._id === order._id);
          if (existingIndex >= 0) {
            // Update existing notification
            updatedHistory[existingIndex] = order;
          } else {
            // Add new notification to history
            updatedHistory.unshift(order);
            historyChanged = true;
          }
        });
        
        // Keep only last 50 notifications in history
        if (updatedHistory.length > 50) {
          updatedHistory.splice(50);
        }
        
        if (historyChanged || updatedHistory.length !== notificationHistory.length) {
          setNotificationHistory(updatedHistory);
          localStorage.setItem('notificationHistory', JSON.stringify(updatedHistory));
        }
        
        // Track if we need to update viewed notifications
        let viewedChanged = false;
        const updatedViewed = new Set(viewedNotifications);
        const isFirstLoad = Object.keys(previousOrdersRef.current).length === 0;
        
        // Check for status changes
        newOrders.forEach(order => {
          const previousOrder = previousOrdersRef.current[order._id];
          
          if (previousOrder && previousOrder.status !== order.status) {
            // Status changed - show notification
            const config = statusConfig[order.status];
            console.log(`🔔 Status changed for order ${order.orderNumber}: ${previousOrder.status} → ${order.status}`);
            playNotificationSound();
            showNotification(
              `Order ${order.orderNumber} is now ${config.label}!`,
              getNotificationSeverity(order.status)
            );
            
            // Mark as unviewed (remove from viewed set)
            updatedViewed.delete(order._id);
            viewedChanged = true;
            
            // Request browser notification permission
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Order Update', {
                body: `Order ${order.orderNumber} is now ${config.label}`,
                icon: '/logo192.png',
                badge: '/logo192.png',
              });
            }
          } else if (!previousOrder && !isFirstLoad) {
            // New order - mark as unviewed ONLY if it's not the first load
            updatedViewed.delete(order._id);
            viewedChanged = true;
          }
          // On first load, don't mark existing orders as unviewed
          // They keep their viewed/unviewed status from localStorage
          
          // Check for delivered orders for feedback
          if (order.status === 'delivered' && !order.hasFeedback) {
            const shownFeedback = sessionStorage.getItem(`feedback_shown_${order._id}`);
            if (!shownFeedback && onOrderDelivered) {
              console.log(`📝 Triggering feedback overlay for order ${order.orderNumber}`);
              sessionStorage.setItem(`feedback_shown_${order._id}`, 'true');
              setTimeout(() => {
                onOrderDelivered(order);
              }, 1000);
            }
          }
        });
        
        // Update viewed notifications if changed
        if (viewedChanged) {
          setViewedNotifications(updatedViewed);
          localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(updatedViewed)));
        }
        
        // Calculate unviewed count AFTER updating viewed set
        // Only count unviewed orders from CURRENT active orders
        const unviewedCount = newOrders.filter(order => !updatedViewed.has(order._id)).length;
        
        // Cleanup: Remove old order IDs from viewed set that are no longer in active orders or history
        // Keep the viewed set lean by only retaining IDs from current active orders and recent history
        const activeOrderIds = new Set(newOrders.map(o => o._id));
        const historyOrderIds = new Set(updatedHistory.map(h => h._id));
        const cleanedViewed = new Set(
          Array.from(updatedViewed).filter(id => activeOrderIds.has(id) || historyOrderIds.has(id))
        );
        
        // Update if cleanup removed any IDs
        if (cleanedViewed.size !== updatedViewed.size) {
          setViewedNotifications(cleanedViewed);
          localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(cleanedViewed)));
        }
        
        // Update previous orders reference
        const ordersMap = {};
        newOrders.forEach(order => {
          ordersMap[order._id] = order;
        });
        previousOrdersRef.current = ordersMap;
        
        setOrders(newOrders);
        
        // Update counts for parent component
        if (onCountChange) {
          onCountChange(newOrders.length);
        }
        if (onUnviewedCountChange) {
          onUnviewedCountChange(unviewedCount);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching active orders:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const playNotificationSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const getNotificationSeverity = (status) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return 'info';
      case 'ready':
        return 'warning';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const toggleExpand = (orderId) => {
    setExpanded(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleSubmitFeedback = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const itemFeedbacks = selectedOrder.items.map(item => ({
        foodId: item.foodId._id,
        foodName: item.name,
        rating: itemRatings[item.foodId._id] || 5,
        comment: itemComments[item.foodId._id] || '',
      }));

      await submitDetailedFeedback({
        orderId: selectedOrder._id,
        orderNumber: selectedOrder.orderNumber,
        shopRating,
        shopFeedback,
        itemFeedbacks,
        serviceQuality,
        deliverySpeed,
      });

      setFeedbackDialog(false);
      setSelectedOrder(null);
      resetFeedbackForm();
      fetchActiveOrders(); // Refresh to remove the delivered order
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFeedbackForm = () => {
    setShopRating(5);
    setShopFeedback('');
    setItemRatings({});
    setItemComments({});
    setServiceQuality(5);
    setDeliverySpeed(5);
  };

  if (orders.length === 0 && notificationHistory.length === 0) return showInDrawer ? (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography color="text.secondary">No notifications</Typography>
    </Box>
  ) : null;

  // Show notification history in drawer, active orders otherwise
  const displayOrders = showInDrawer ? notificationHistory : orders;

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          mb: showInDrawer ? 0 : 3,
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box sx={{ p: 2, color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon />
            {showInDrawer ? `All Notifications (${displayOrders.length})` : `Active Orders (${displayOrders.length})`}
          </Typography>
          {showInDrawer && orders.length > 0 && (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {orders.length} active order{orders.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {displayOrders.map((order) => {
          const config = statusConfig[order.status];
          const isExpanded = expanded[order._id];

          return (
            <Paper
              key={order._id}
              sx={{
                m: 2,
                borderRadius: '12px',
                overflow: 'hidden',
                border: `2px solid ${config.color}`,
              }}
            >
              {/* Order Header */}
              <Box
                sx={{
                  p: 2,
                  background: config.bg,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => toggleExpand(order._id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: config.color }}>{config.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {order.orderNumber}
                    </Typography>
                    <Chip
                      label={config.label}
                      size="small"
                      sx={{
                        backgroundColor: config.color,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px',
                      }}
                    />
                  </Box>
                </Box>
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Progress Bar */}
              <LinearProgress
                variant="determinate"
                value={config.progress}
                sx={{
                  height: 6,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: config.color,
                  },
                }}
              />

              {/* Order Details */}
              <Collapse in={isExpanded}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Order Time: {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} mb={1}>
                    Items ({order.items.length}):
                  </Typography>
                  {order.items.map((item, idx) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      • {item.name} x{item.quantity}
                    </Typography>
                  ))}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Total:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      ₹{order.grandTotal}
                    </Typography>
                  </Box>

                  {/* Status Timeline */}
                  {order.statusHistory && order.statusHistory.length > 0 && (
                    <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid #e5e7eb' }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                        Order Timeline:
                      </Typography>
                      {order.statusHistory.map((history, idx) => (
                        <Box key={idx} sx={{ mb: 1, position: 'relative' }}>
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -10,
                              top: 4,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: statusConfig[history.status]?.color || '#9ca3af',
                            }}
                          />
                          <Typography variant="caption" display="block">
                            {statusConfig[history.status]?.label || history.status}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                            {new Date(history.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Paper>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => !loading && setFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon />
            Your Feedback Matters!
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedOrder && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Order #{selectedOrder.orderNumber} has been delivered!
              </Typography>

              {/* Shop Rating */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Overall Shop Experience
                </Typography>
                <Rating
                  value={shopRating}
                  onChange={(e, value) => setShopRating(value)}
                  size="large"
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Tell us about your experience..."
                  value={shopFeedback}
                  onChange={(e) => setShopFeedback(e.target.value)}
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Service Quality */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Service Quality
                </Typography>
                <Rating
                  value={serviceQuality}
                  onChange={(e, value) => setServiceQuality(value)}
                  size="medium"
                />
              </Box>

              {/* Delivery Speed */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Delivery Speed
                </Typography>
                <Rating
                  value={deliverySpeed}
                  onChange={(e, value) => setDeliverySpeed(value)}
                  size="medium"
                />
              </Box>

              {/* Item Ratings */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Rate Your Items
                </Typography>
                {selectedOrder.items.map((item) => (
                  <Paper key={item.foodId._id} sx={{ p: 2, mb: 2, background: '#f9fafb' }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      {item.name}
                    </Typography>
                    <Rating
                      value={itemRatings[item.foodId._id] || 5}
                      onChange={(e, value) =>
                        setItemRatings(prev => ({ ...prev, [item.foodId._id]: value }))
                      }
                      size="small"
                    />
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Comments about this item..."
                      value={itemComments[item.foodId._id] || ''}
                      onChange={(e) =>
                        setItemComments(prev => ({ ...prev, [item.foodId._id]: e.target.value }))
                      }
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setFeedbackDialog(false)} disabled={loading}>
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OrderNotifications;
