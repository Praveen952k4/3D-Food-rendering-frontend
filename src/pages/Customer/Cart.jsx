import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { useNavigate } from 'react-router-dom';
import { getFoodItems, createOrder, validateCoupon, getAvailableCoupons } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import FoodViewer3D from '../../components/FoodViewer3D';

const CustomerCart = () => {
  const { themeMode } = useThemeMode();
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNumber, setOrderNumber] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState(null);
  const [customization, setCustomization] = useState({
    spiceLevel: 'medium',
    extras: [],
    specialInstructions: '',
  });
  const navigate = useNavigate();

  // Extras pricing
  const extrasPricing = {
    'extra-cheese': 20,
    'extra-sauce': 10,
    'extra-veggies': 15,
    'extra-meat': 30,
    'extra-salt': 5,
  };

  useEffect(() => {
    loadCart();
    loadAvailableCoupons();
  }, []);

  const loadAvailableCoupons = async () => {
    try {
      const response = await getAvailableCoupons();
      setAvailableCoupons(response.data || []);
    } catch (error) {
      console.error('Failed to load available coupons:', error);
    }
  };

  const loadCart = async () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (!savedCart) {
        setCartItems([]);
        return;
      }

      const cart = JSON.parse(savedCart);
      const customizationData = localStorage.getItem('cartCustomization');
      const cartCustomization = customizationData ? JSON.parse(customizationData) : {};
      
      const response = await getFoodItems();
      const allFoods = response.data.foodItems || [];

      const items = [];
      Object.keys(cart).forEach((foodId) => {
        const food = allFoods.find((f) => f._id === foodId);
        if (food && cart[foodId] > 0) {
          items.push({
            _id: food._id,
            name: food.name,
            price: food.price,
            quantity: cart[foodId],
            imageUrl: food.imageUrl,
            isVeg: food.isVeg,
            calories: food.calories,
            customizations: cartCustomization[foodId] || [],
          });
        }
      });

      setCartItems(items);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const updateQuantity = (foodId, change) => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;

    const cart = JSON.parse(savedCart);
    cart[foodId] = (cart[foodId] || 0) + change;

    if (cart[foodId] <= 0) {
      delete cart[foodId];
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  };

  const removeItem = (foodId) => {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;

    const cart = JSON.parse(savedCart);
    delete cart[foodId];

    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  };

  const openCustomizeDialog = (item) => {
    setSelectedItemForCustomization(item);
    setCustomization({
      spiceLevel: 'medium',
      extras: [],
      specialInstructions: '',
    });
    setCustomizeDialogOpen(true);
  };

  const handleAddCustomization = () => {
    if (!selectedItemForCustomization) return;

    const customizationData = localStorage.getItem('cartCustomization');
    const cartCustomization = customizationData ? JSON.parse(customizationData) : {};

    if (!cartCustomization[selectedItemForCustomization._id]) {
      cartCustomization[selectedItemForCustomization._id] = [];
    }

    // Check if we can add more customizations
    if (cartCustomization[selectedItemForCustomization._id].length >= selectedItemForCustomization.quantity) {
      alert(`You can only customize up to ${selectedItemForCustomization.quantity} items`);
      return;
    }

    // Add new customization
    cartCustomization[selectedItemForCustomization._id].push({
      spiceLevel: customization.spiceLevel,
      extras: customization.extras,
      specialInstructions: customization.specialInstructions,
    });

    localStorage.setItem('cartCustomization', JSON.stringify(cartCustomization));
    
    // Reload cart to show updated customizations
    loadCart();
    setCustomizeDialogOpen(false);
    setCustomization({
      spiceLevel: 'medium',
      extras: [],
      specialInstructions: '',
    });
  };

  const handleExtraToggle = (extra) => {
    setCustomization(prev => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter(e => e !== extra)
        : [...prev.extras, extra]
    }));
  };

  const calculateExtrasTotal = () => {
    return customization.extras.reduce((sum, extra) => sum + (extrasPricing[extra] || 0), 0);
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;

    setCouponLoading(true);
    try {
      const subtotal = getSubtotal();
      const response = await validateCoupon(promoCode, subtotal);
      
      if (response.data.success) {
        const { coupon } = response.data;
        const discount = coupon.discount || 0;
        setAppliedCoupon(coupon);
        setCouponDiscount(discount);
        alert(`✓ Coupon applied! You saved ₹${discount.toFixed(2)}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired coupon';
      alert(message);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleQuickApplyCoupon = async (couponCode) => {
    setPromoCode(couponCode);
    setCouponLoading(true);
    try {
      const subtotal = getSubtotal();
      const response = await validateCoupon(couponCode, subtotal);
      
      if (response.data.success) {
        const { coupon } = response.data;
        const discount = coupon.discount || 0;
        setAppliedCoupon(coupon);
        setCouponDiscount(discount);
        alert(`✓ Coupon applied! You saved ₹${discount.toFixed(2)}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired coupon';
      alert(message);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setPromoCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const getSubtotal = () => {
    let total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Add extras pricing
    cartItems.forEach(item => {
      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(custom => {
          if (custom.extras && custom.extras.length > 0) {
            custom.extras.forEach(extra => {
              total += extrasPricing[extra] || 0;
            });
          }
        });
      }
    });
    
    return total;
  };

  const getTax = () => {
    return getSubtotal() * 0.05; // 5% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - couponDiscount;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    setCheckoutDialogOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      alert('Please enter table number for dine-in orders');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map((item) => ({
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          customizations: item.customizations || [],
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        discount: 0,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        couponDiscount: couponDiscount,
        grandTotal: getTotal(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber.trim() : '',
        paymentMethod,
      };

      console.log('🛒 Placing order with data:', JSON.stringify(orderData, null, 2));
      console.log('🔑 Token present:', !!localStorage.getItem('token'));
      
      const response = await createOrder(orderData);
      console.log('✅ Order created successfully:', response.data);
      
      localStorage.removeItem('cart');
      localStorage.removeItem('cartCustomization');
      
      setOrderNumber(response.data.orderNumber);
      setCheckoutDialogOpen(false);
      setSuccessDialogOpen(true);
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('orderPlaced', { 
        detail: { 
          orderNumber: response.data.orderNumber,
          order: response.data.order 
        } 
      }));
      
      // Show browser notification (with error handling for mobile)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Order Placed Successfully! 🎉', {
            body: `Order ${response.data.orderNumber} has been placed and is pending confirmation.`,
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        } catch (err) {
          console.log('Browser notification not supported:', err);
        }
      }
    } catch (error) {
      console.error('❌ Checkout failed:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    navigate('/customer/home');
  };

  if (initialLoading) {
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: themeMode === 'dark' ? '#0f0f0f' : '#f5f5f5',
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
            <ShoppingCart style={{ fontSize: 28, color: '#667eea' }} />
          </div>
        </div>
        <Typography variant="body2" sx={{ color: themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
          Loading your cart...
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: themeMode === 'dark' ? '#0f0f0f' : '#f8f9fa', minHeight: '100vh', paddingBottom: '200px' }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1.5, sm: 2 },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <IconButton color="inherit" onClick={() => navigate('/customer/home')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Cart
            </Typography>
          </div>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 }, pb: { xs: '250px', sm: '220px' } }}>
        {cartItems.length === 0 ? (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
            color: themeMode === 'dark' ? 'white' : 'inherit',
          }}>
            <Typography variant="h6" color="text.secondary">
              Your cart is empty
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/customer/home')}
              sx={{ mt: 2 }}
            >
              Browse Menu
            </Button>
          </Paper>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ marginBottom: '24px' }}>
              {cartItems.map((item) => (
                <Card 
                  key={item._id} 
                  sx={{ 
                    mb: { xs: 1.5, sm: 2 },
                    borderRadius: { xs: '8px', sm: '12px' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <div style={{ display: 'flex', padding: '12px', gap: '12px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        sx={{ 
                          width: { xs: 70, sm: 80 }, 
                          height: { xs: 70, sm: 80 }, 
                          borderRadius: { xs: 1.5, sm: 2 },
                        }}
                        image={item.imageUrl || 'https://via.placeholder.com/150?text=Food'}
                        alt={item.name}
                      />
                      {item.modelUrl && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFood(item);
                            setViewerOpen(true);
                          }}
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            background: 'rgba(102, 126, 234, 0.95)',
                            color: 'white',
                            padding: '4px',
                            '&:hover': {
                              background: 'rgba(102, 126, 234, 1)',
                            },
                          }}
                        >
                          <ViewInArIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      )}
                    </div>
                    <CardContent sx={{ flex: 1, py: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Veg/Non-veg indicator */}
                            <div
                              style={{
                                width: '14px',
                                height: '14px',
                                border: `2px solid ${item.isVeg ? 'green' : 'red'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: item.isVeg ? 'green' : 'red',
                                }}
                              />
                            </div>
                            <Typography variant="body1" fontWeight="bold">
                              {item.name}
                            </Typography>
                          </div>
                          {/* Calories Display */}
                          {item.calories && (
                            <Typography variant="caption" sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', mt: 0.5 }}>
                              🔥 {item.calories} kcal
                            </Typography>
                          )}
                          <Typography variant="h6" color="primary" fontWeight="bold" mt={1}>
                            ₹{item.price}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Qty: {item.quantity}
                          </Typography>
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(item._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </div>

                      {/* Customizations Accordion Dropdown */}
                      {item.customizations && item.customizations.length > 0 && (
                        <Accordion 
                          sx={{ 
                            marginTop: '12px',
                            boxShadow: 'none',
                            border: `1px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
                            '&:before': { display: 'none' },
                            borderRadius: '8px !important',
                          }}
                          defaultExpanded={false}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: themeMode === 'dark' ? 'white' : 'inherit' }} />}
                            sx={{
                              backgroundColor: themeMode === 'dark' 
                                ? 'rgba(102, 126, 234, 0.15)'
                                : '#f0f9ff',
                              borderRadius: '8px',
                              minHeight: '48px',
                              '&.Mui-expanded': {
                                minHeight: '48px',
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              },
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <span style={{ fontSize: '1.2rem' }}>🎨</span>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: themeMode === 'dark' ? 'white' : '#1e40af', flex: 1 }}>
                                Customizations
                              </Typography>
                              <Chip 
                                label={`${item.customizations.length}/${item.quantity}`}
                                size="small"
                                sx={{
                                  background: '#3b82f6',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                }}
                              />
                            </div>
                          </AccordionSummary>
                          <AccordionDetails sx={{ 
                            padding: '16px', 
                            maxHeight: '400px', 
                            overflowY: 'auto',
                            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
                          }}>
                            {item.customizations.map((custom, idx) => (
                              <Paper
                                key={idx}
                                elevation={0}
                                sx={{
                                  marginBottom: idx < item.customizations.length - 1 ? '12px' : '0',
                                  padding: '12px',
                                  background: themeMode === 'dark' ? '#0f0f0f' : '#f9fafb',
                                  border: `1px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                                  borderRadius: '8px',
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#667eea', 
                                    display: 'block', 
                                    fontWeight: 700, 
                                    marginBottom: '8px',
                                    fontSize: '0.75rem',
                                  }}
                                >
                                  Item #{idx + 1}
                                </Typography>
                                
                                {/* Spice Level */}
                                {custom.spiceLevel && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <Chip
                                      label={`🌶️ ${custom.spiceLevel.toUpperCase()}`}
                                      size="small"
                                      sx={{
                                        background: '#fef3c7',
                                        border: '1px solid #f59e0b',
                                        color: '#92400e',
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: '24px',
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Extras */}
                                {custom.extras && custom.extras.length > 0 && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {custom.extras.map((extra) => (
                                        <Chip
                                          key={extra}
                                          label={extra.replace('extra-', '').replace(/-/g, ' ')}
                                          size="small"
                                          sx={{
                                            background: '#dbeafe',
                                            border: '1px solid #3b82f6',
                                            color: '#1e40af',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: '24px',
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Special Instructions */}
                                {custom.specialInstructions && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: '#6b7280', 
                                      fontStyle: 'italic',
                                      display: 'block',
                                      fontSize: '0.7rem',
                                      marginTop: '4px',
                                    }}
                                  >
                                    📝 {custom.specialInstructions}
                                  </Typography>
                                )}
                              </Paper>
                            ))}
                            
                            {/* Add More Button inside accordion */}
                            {item.customizations.length < item.quantity && (
                              <Button
                                variant="outlined"
                                fullWidth
                                size="small"
                                onClick={() => openCustomizeDialog(item)}
                                sx={{
                                  marginTop: '12px',
                                  borderColor: '#667eea',
                                  color: '#667eea',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: '#764ba2',
                                    background: 'rgba(102, 126, 234, 0.05)',
                                  },
                                }}
                              >
                                + Add Another Customization
                              </Button>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Add Customization Button (if no customizations exist) */}
                      {(!item.customizations || item.customizations.length === 0) && (
                        <Button
                          variant="outlined"
                          fullWidth
                          size="small"
                          onClick={() => openCustomizeDialog(item)}
                          sx={{
                            marginTop: '12px',
                            borderColor: '#667eea',
                            color: '#667eea',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            padding: '8px',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: '#764ba2',
                              background: 'rgba(102, 126, 234, 0.05)',
                            },
                          }}
                        >
                          🎨 Customize This Item
                        </Button>
                      )}

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '16px',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item._id, -1)}
                            sx={{
                              color: '#667eea',
                            }}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography
                            sx={{
                              px: 2,
                              fontWeight: 'bold',
                              minWidth: 30,
                              textAlign: 'center',
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item._id, 1)}
                            sx={{
                              color: '#667eea',
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </div>
                        <Typography variant="caption" color="text.secondary">
                          ₹{item.price} each
                        </Typography>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Available Coupons */}
            {!appliedCoupon && availableCoupons.length > 0 && (
              <Paper 
                sx={{ 
                  p: 2.5, 
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 2,
                  background: themeMode === 'dark'
                    ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(253, 230, 138, 0.15) 100%)'
                    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '2px solid #fbbf24',
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#92400e',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🎁</span>
                  Available Coupons
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableCoupons.map((coupon) => (
                    <Chip
                      key={coupon._id}
                      label={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong>{coupon.code}</strong>
                          <span style={{ fontSize: '0.85rem' }}>
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} OFF`}
                          </span>
                        </span>
                      }
                      onClick={() => handleQuickApplyCoupon(coupon.code)}
                      disabled={couponLoading}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2, #667eea)',
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
                {availableCoupons.length > 0 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#92400e',
                      display: 'block',
                      mt: 1,
                      fontSize: '0.75rem',
                    }}
                  >
                    💡 Tap any coupon to apply instantly
                  </Typography>
                )}
              </Paper>
            )}

            {/* Promo Code */}
            <Paper 
              sx={{ 
                p: 2.5, 
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                mb: 3,
                backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
                border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 700, 
                  color: themeMode === 'dark' ? 'white' : '#1f2937',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🎟️</span>
                Have a Promo Code?
              </Typography>
              <div style={{ display: 'flex', gap: '12px' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                  inputProps={{
                    style: { textTransform: 'uppercase' }
                  }}
                />
                <Button
                  variant="contained"
                  disabled={!promoCode.trim() || couponLoading || appliedCoupon}
                  onClick={handleApplyCoupon}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    whiteSpace: 'nowrap',
                    minWidth: '100px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2, #667eea)',
                    },
                    '&:disabled': {
                      background: '#e5e7eb',
                      color: '#9ca3af',
                    }
                  }}
                >
                  {couponLoading ? <CircularProgress size={20} color="inherit" /> : (appliedCoupon ? 'Applied' : 'Apply')}
                </Button>
              </div>
            </Paper>
            
            {/* Applied Coupon Display */}
            {appliedCoupon && (
              <Paper
                sx={{
                  p: 2,
                  mt: 2,
                  background: themeMode === 'dark'
                    ? 'linear-gradient(135deg, rgba(212, 252, 121, 0.15) 0%, rgba(150, 230, 161, 0.15) 100%)'
                    : 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                  border: '2px dashed #10b981',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography variant="body2" fontWeight="bold" color="success.dark">
                      ✓ Coupon Applied: {appliedCoupon.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appliedCoupon.description}
                    </Typography>
                  </div>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemoveCoupon}
                    sx={{ minWidth: 'auto' }}
                  >
                    Remove
                  </Button>
                </div>
              </Paper>
            )}
          </>
        )}
      </Container>

      {/* Bottom Summary */}
      {cartItems.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: { xs: 2, sm: 2.5 },
            borderTopLeftRadius: { xs: 16, sm: 20 },
            borderTopRightRadius: { xs: 16, sm: 20 },
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography>Subtotal</Typography>
                <Typography fontWeight="bold">₹{getSubtotal().toFixed(2)}</Typography>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography>Tax and fees</Typography>
                <Typography fontWeight="bold">₹{getTax().toFixed(2)}</Typography>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Typography color="success.main">Coupon Discount ({appliedCoupon.code})</Typography>
                  <Typography fontWeight="bold" color="success.main">-₹{couponDiscount.toFixed(2)}</Typography>
                </div>
              )}
              <Divider sx={{ my: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Typography variant="h6" fontWeight="bold">
                  Total ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  ₹{getTotal().toFixed(2)}
                </Typography>
              </div>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCheckout}
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #ff9a56 30%, #ff6b6b 90%)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #ff6b6b 30%, #ff9a56 90%)',
                  },
                }}
              >
                {loading ? 'Processing...' : 'Checkout'}
              </Button>
            </div>
          </Container>
        </Paper>
      )}

      {/* Checkout Dialog */}
      <Dialog 
        open={checkoutDialogOpen} 
        onClose={() => !loading && setCheckoutDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: '12px' },
            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
            border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
          }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          Complete Your Order
        </DialogTitle>
        <DialogContent sx={{ mt: 2, backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white' }}>
          <TextField
            fullWidth
            label="Your Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            margin="normal"
            required
            placeholder="Enter your full name"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
              '& label.Mui-focused': {
                color: '#667eea',
              },
            }}
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            margin="normal"
            required
            placeholder="Enter 10-digit phone number"
            inputProps={{ maxLength: 10 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
              '& label.Mui-focused': {
                color: '#667eea',
              },
            }}
          />

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2, width: '100%' }}>
            <FormLabel 
              component="legend" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1rem',
                color: themeMode === 'dark' ? 'white' : '#1f2937',
                mb: 1.5,
              }}
            >
              Order Type
            </FormLabel>
            <RadioGroup
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              sx={{ gap: 1.5 }}
            >
              <Paper
                elevation={orderType === 'dine-in' ? 3 : 0}
                sx={{
                  p: 2,
                  border: orderType === 'dine-in' ? '2px solid #667eea' : `2px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: orderType === 'dine-in' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : themeMode === 'dark' ? '#1a1a1a' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                  },
                }}
                onClick={() => setOrderType('dine-in')}
              >
                <FormControlLabel
                  value="dine-in"
                  control={
                    <Radio 
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                      <RestaurantIcon sx={{ color: orderType === 'dine-in' ? '#667eea' : '#9ca3af' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: themeMode === 'dark' ? 'white' : '#1f2937' }}>
                          Dine In
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Enjoy your meal at the restaurant
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>
              <Paper
                elevation={orderType === 'takeaway' ? 3 : 0}
                sx={{
                  p: 2,
                  border: orderType === 'takeaway' ? '2px solid #667eea' : `2px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: orderType === 'takeaway' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : themeMode === 'dark' ? '#1a1a1a' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                  },
                }}
                onClick={() => setOrderType('takeaway')}
              >
                <FormControlLabel
                  value="takeaway"
                  control={
                    <Radio 
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                      <TakeoutDiningIcon sx={{ color: orderType === 'takeaway' ? '#667eea' : '#9ca3af' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: themeMode === 'dark' ? 'white' : '#1f2937' }}>
                          Takeaway
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pick up your order to go
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>
            </RadioGroup>
          </FormControl>

          {orderType === 'dine-in' && (
            <TextField
              fullWidth
              label="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              margin="normal"
              required
              placeholder="Enter table number"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
                '& label.Mui-focused': {
                  color: '#667eea',
                },
              }}
            />
          )}

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2, width: '100%' }}>
            <FormLabel 
              component="legend" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1rem',
                color: themeMode === 'dark' ? 'white' : '#1f2937',
                mb: 1.5,
              }}
            >
              Payment Method
            </FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ gap: 1.5 }}
            >
              <Paper
                elevation={paymentMethod === 'cash' ? 3 : 0}
                sx={{
                  p: 2,
                  border: paymentMethod === 'cash' ? '2px solid #667eea' : `2px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: paymentMethod === 'cash' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : themeMode === 'dark' ? '#1a1a1a' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                  },
                }}
                onClick={() => setPaymentMethod('cash')}
              >
                <FormControlLabel
                  value="cash"
                  control={
                    <Radio 
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ color: themeMode === 'dark' ? 'white' : '#1f2937' }}>
                        💵 Cash on Delivery
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pay with cash when your order arrives
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>
              <Paper
                elevation={paymentMethod === 'online' ? 3 : 0}
                sx={{
                  p: 2,
                  border: paymentMethod === 'online' ? '2px solid #667eea' : `2px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  background: paymentMethod === 'online' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' : themeMode === 'dark' ? '#1a1a1a' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                  },
                }}
                onClick={() => setPaymentMethod('online')}
              >
                <FormControlLabel
                  value="online"
                  control={
                    <Radio 
                      sx={{
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ color: themeMode === 'dark' ? 'white' : '#1f2937' }}>
                        💳 Online Payment
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        UPI • Card • Net Banking • Wallet
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Paper>
            </RadioGroup>
          </FormControl>

          <Paper 
            sx={{ 
              p: 3, 
              mt: 3, 
              background: themeMode === 'dark' 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '2px solid rgba(102, 126, 234, 0.2)',
              borderRadius: '12px',
            }}
          >
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              gutterBottom
              sx={{ 
                color: '#667eea',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              🧾 Order Summary
            </Typography>
            <Box sx={{ mt: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Typography variant="body1" color="text.secondary">
                  Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                </Typography>
                <Typography variant="body1" fontWeight="600">₹{getSubtotal().toFixed(2)}</Typography>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Typography variant="body1" color="text.secondary">Tax (5%)</Typography>
                <Typography variant="body1" fontWeight="600">₹{getTax().toFixed(2)}</Typography>
              </div>
              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Typography variant="body1" sx={{ color: '#10b981' }}>Coupon Discount</Typography>
                  <Typography variant="body1" fontWeight="600" sx={{ color: '#10b981' }}>-₹{couponDiscount.toFixed(2)}</Typography>
                </div>
              )}
              <Divider sx={{ my: 2, borderColor: 'rgba(102, 126, 234, 0.3)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: themeMode === 'dark' ? 'white' : '#1f2937' }}>Total Amount</Typography>
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ₹{getTotal().toFixed(2)}
                </Typography>
              </div>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCheckoutDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? '⏳ Placing Order...' : '🛒 Place Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog 
        open={successDialogOpen} 
        onClose={handleSuccessClose}
        PaperProps={{
          sx: {
            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
            border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
            borderRadius: '12px',
          }
        }}
      >
        <DialogContent sx={{ 
          textAlign: 'center', 
          p: 4,
          backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: themeMode === 'dark' ? 'white' : 'inherit' }}>
            Order Placed Successfully!
          </Typography>
          <Paper sx={{ 
            p: 2, 
            mt: 2, 
            background: themeMode === 'dark' 
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
              : '#f0f7ff',
            border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
          }}>
            <Typography variant="caption" color="text.secondary">
              Your Order Number
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>
              {orderNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please save this number for reference
            </Typography>
          </Paper>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            {orderType === 'dine-in' 
              ? `Your food will be served at Table ${tableNumber}`
              : 'Your order will be ready for pickup soon'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white' }}>
          <Button fullWidth variant="contained" onClick={handleSuccessClose}>
            Back to Menu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customization Dialog */}
      <Dialog 
        open={customizeDialogOpen} 
        onClose={() => setCustomizeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: '16px' },
            m: { xs: 0, sm: 2 },
            backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
            border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
          }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎨</span>
            <div>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                Customize Your Order
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {selectedItemForCustomization?.name}
              </Typography>
            </div>
          </div>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white' }}>
          {/* Spice Level */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel sx={{ fontWeight: 600, color: themeMode === 'dark' ? 'white' : '#1f2937', mb: 1 }}>
              🌶️ Spice Level
            </FormLabel>
            <RadioGroup
              value={customization.spiceLevel}
              onChange={(e) => setCustomization({ ...customization, spiceLevel: e.target.value })}
            >
              <FormControlLabel 
                value="mild" 
                control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                label="Mild - Just a hint of spice" 
              />
              <FormControlLabel 
                value="medium" 
                control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                label="Medium - Balanced heat" 
              />
              <FormControlLabel 
                value="spicy" 
                control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                label="Spicy - Hot and flavorful" 
              />
              <FormControlLabel 
                value="extra-spicy" 
                control={<Radio sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' } }} />} 
                label="Extra Spicy - For heat lovers!" 
              />
            </RadioGroup>
          </FormControl>

          {/* Extras */}
          <div style={{ marginBottom: '24px' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: themeMode === 'dark' ? 'white' : '#1f2937', mb: 2 }}>
              ➕ Add Extras
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'extra-cheese', label: 'Extra Cheese', price: 20 },
                { id: 'extra-sauce', label: 'Extra Sauce', price: 10 },
                { id: 'extra-veggies', label: 'Extra Veggies', price: 15 },
                { id: 'extra-meat', label: 'Extra Meat', price: 30 },
                { id: 'extra-salt', label: 'Extra Salt', price: 5 },
              ].map((extra) => (
                <Paper
                  key={extra.id}
                  sx={{
                    p: 2,
                    border: customization.extras.includes(extra.id) ? '2px solid #667eea' : `1px solid ${themeMode === 'dark' ? '#2d2d2d' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: customization.extras.includes(extra.id) 
                      ? 'rgba(102, 126, 234, 0.05)' 
                      : themeMode === 'dark' ? '#1a1a1a' : '#fff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      background: 'rgba(102, 126, 234, 0.05)',
                    }
                  }}
                  onClick={() => handleExtraToggle(extra.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${customization.extras.includes(extra.id) ? '#667eea' : '#d1d5db'}`,
                        background: customization.extras.includes(extra.id) ? '#667eea' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        {customization.extras.includes(extra.id) && '✓'}
                      </div>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: themeMode === 'dark' ? 'white' : '#1f2937' }}>
                        {extra.label}
                      </Typography>
                    </div>
                    <Chip 
                      label={`+₹${extra.price}`} 
                      size="small" 
                      sx={{ 
                        background: '#10b981', 
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }} 
                    />
                  </div>
                </Paper>
              ))}
            </div>
          </div>

          {/* Extras Total */}
          {customization.extras.length > 0 && (
            <Paper sx={{ 
              p: 2, 
              mb: 3, 
              background: themeMode === 'dark' 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                : '#f0f9ff', 
              border: `1px solid ${themeMode === 'dark' ? '#2d2d2d' : '#3b82f6'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 600 }}>
                  Extras Total:
                </Typography>
                <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 700 }}>
                  +₹{calculateExtrasTotal()}
                </Typography>
              </div>
            </Paper>
          )}

          {/* Special Instructions */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="📝 Special Instructions (Optional)"
            placeholder="Any special requests? (e.g., less oil, no onions, well done)"
            value={customization.specialInstructions}
            onChange={(e) => setCustomization({ ...customization, specialInstructions: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#667eea',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white' }}>
          <Button 
            onClick={() => setCustomizeDialogOpen(false)}
            sx={{ 
              flex: 1,
              color: '#6b7280',
              borderColor: '#d1d5db',
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCustomization}
            variant="contained"
            sx={{ 
              flex: 2,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
              }
            }}
          >
            Add Customization
            {calculateExtrasTotal() > 0 && ` (+₹${calculateExtrasTotal()})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3D Viewer Dialog */}
      {selectedFood && (
        <Dialog
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={typeof window !== 'undefined' && window.innerWidth < 900}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              borderRadius: { xs: 0, sm: '12px' },
              height: { xs: '100%', sm: '85vh' },
              backgroundColor: themeMode === 'dark' ? '#1a1a1a' : 'white',
              border: themeMode === 'dark' ? '1px solid #2d2d2d' : 'none',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <Typography variant="h6" component="span">{selectedFood.name}</Typography>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                3D View - Drag to rotate
              </Typography>
            </div>
            <IconButton
              onClick={() => setViewerOpen(false)}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '100%', backgroundColor: themeMode === 'dark' ? '#0f0f0f' : 'white' }}>
            <FoodViewer3D foodItem={selectedFood} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerCart;
