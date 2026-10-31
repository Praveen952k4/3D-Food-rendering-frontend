import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  IconButton,
  Button,
  MenuItem,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CheckCircle from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { getFoodItems, createOrder, validateCoupon, getAvailableCoupons, getTables, getMyTable } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../components/ui/MessageDialog';
import ThemeToggle from '../../components/ui/ThemeToggle';
import ClimateLabel from '../../components/food/ClimateLabel';
import { LoadingPanel } from '../../components/ui/Loaders';
import { formatINR, GST_RATE } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';
import { sortTablesByNumber } from '../../utils/tableUtils';
import FoodViewer3D from '../../components/FoodViewer3D';

const CustomerCart = () => {
  const { themeMode } = useThemeMode();
  const { user, isGuest } = useAuth();
  const { showError, showSuccess, showInfo } = useMessage();
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
  // The table the diner is actually sitting at, and the ones nobody is using.
  // A typed-in number used to be taken at face value, which put two parties on
  // one table's tickets without telling either of them.
  const [myTable, setMyTable] = useState(null);
  const [tables, setTables] = useState([]);
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

  // A guest already told us their table and name when they signed in, and a
  // customer's phone is on their account — don't make them type it twice.
  useEffect(() => {
    if (!user) return;
    if (user.tableNumber) setTableNumber(user.tableNumber);
    if (user.name) setCustomerName((current) => current || user.name);
    if (!isGuest && user.phone) setCustomerPhone((current) => current || user.phone);
  }, [user, isGuest]);

  // Where this diner is sitting, and which tables are free. Someone already at
  // a table cannot order for a different one; someone who is not yet at one
  // picks from the free tables rather than typing a number that may belong to
  // the party next to them.
  useEffect(() => {
    let cancelled = false;

    getMyTable()
      .then((res) => {
        if (cancelled) return;
        const held = res.data.table;
        setMyTable(held);
        if (held) setTableNumber(held.number);
      })
      .catch(() => {});

    getTables()
      .then((res) => {
        if (!cancelled) setTables(sortTablesByNumber(res.data.tables || []));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

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
            prepTimeMinutes: food.prepTimeMinutes ?? 15,
            // the climate label is derived from the category too, so carry it
            category: food.category,
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
      showInfo(`You can only customise up to ${selectedItemForCustomization.quantity} of these.`);
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
        showSuccess(`You saved ₹${discount.toFixed(2)} on this order.`, { title: 'Coupon applied' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired coupon';
      showError(message, { title: 'That coupon did not work' });
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
        showSuccess(`You saved ₹${discount.toFixed(2)} on this order.`, { title: 'Coupon applied' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired coupon';
      showError(message, { title: 'That coupon did not work' });
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

  // The kitchen works on dishes in parallel, so an order is ready when its
  // slowest dish is — not after the sum of every dish on it.
  const getEstimatedPrepMinutes = () =>
    cartItems.reduce((longest, item) => Math.max(longest, item.prepTimeMinutes ?? 15), 0);

  // Extras ride on the line they were added to, so a dish carries its own
  // extras in its total. The order used to count them only in the subtotal,
  // which left the items adding up to less than the order they belong to —
  // and the admin's top dishes reading low by exactly that much.
  const getItemTotal = (item) =>
    item.price * item.quantity +
    (item.customizations || []).reduce(
      (sum, custom) =>
        sum + (custom.extras || []).reduce((extras, extra) => extras + (extrasPricing[extra] || 0), 0),
      0
    );

  const getSubtotal = () => cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  // GST is charged on what the diner actually pays for the food, so a coupon
  // comes off before the tax does. Charging it on the full subtotal left the
  // stored tax higher than 5% of the taxable value every report derives from
  // it — the receipt, the GST register and the dashboard all disagreed.
  const getTaxableValue = () => Math.max(getSubtotal() - couponDiscount, 0);

  const getTax = () => getTaxableValue() * GST_RATE;

  const getTotal = () => getTaxableValue() + getTax();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showInfo('Your cart is empty — add a dish first.');
      return;
    }

    setCheckoutDialogOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      showInfo('Please enter your name.', { title: 'Please enter your name' });
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 10) {
      showInfo('Please enter a valid 10-digit phone number.', { title: 'Please enter your phone number' });
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      showInfo('Please enter your table number for a dine-in order.', { title: 'Please enter table number' });
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
          subtotal: getItemTotal(item),
          prepTimeMinutes: item.prepTimeMinutes ?? 15,
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

        // The table was somebody else's, or not the one they are sitting at.
        // Put the right number in for them and refresh what is free, so the
        // next attempt is not the same mistake.
        if (error.response.status === 409) {
          const yours = error.response.data.yourTable;
          if (yours) setTableNumber(yours);
          getTables().then((res) => setTables(res.data.tables || [])).catch(() => {});
          getMyTable().then((res) => setMyTable(res.data.table)).catch(() => {});
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage, { title: 'Your order was not placed' });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    navigate('/customer/home');
  };

  if (initialLoading) {
    return <LoadingPanel minHeight="100vh">Loading your cart…</LoadingPanel>;
  }

  return (
    <div style={{ backgroundColor: 'var(--ad-bg-2)', minHeight: '100vh', paddingBottom: 'calc(170px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: 0,
          borderInline: 0,
          borderTop: 0,
          backdropFilter: 'blur(14px)',
          backgroundColor: 'color-mix(in srgb, var(--ad-surface) 90%, transparent)',
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 22, lineHeight: 1.2 }}>
                Your cart
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Prices include GST
              </Typography>
            </div>
            <ThemeToggle size="small" />
          </div>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 }, pb: { xs: '170px', sm: '150px' } }}>
        {cartItems.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed var(--ad-line-strong)' }}>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 22, mb: 0.5 }}>
              Nothing here yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a dish from the menu and it will show up here with its climate label.
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
                    mb: { xs: 1, sm: 1.5 },
                    borderRadius: '10px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    backgroundColor: 'var(--ad-surface)',
                    '&:hover': {
                      boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                    }
                  }}
                >
                  <div style={{ display: 'flex', padding: '10px', gap: '10px' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        sx={{ 
                          width: { xs: 60, sm: 72 }, 
                          height: { xs: 60, sm: 72 }, 
                          borderRadius: 1.5,
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
                            background: 'rgba(226, 85, 43, 0.95)',
                            color: 'white',
                            padding: '4px',
                            '&:hover': {
                              background: 'rgba(226, 85, 43, 1)',
                            },
                          }}
                        >
                          <ViewInArIcon sx={{ fontSize: '16px' }} />
                        </IconButton>
                      )}
                    </div>
                    <CardContent sx={{ flex: 1, py: 0, px: '0 !important' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, pr: 1 }}>
                          {/* Veg/Non-veg indicator */}
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              border: `2px solid ${item.isVeg ? 'var(--ad-basil)' : 'var(--ad-ember)'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: item.isVeg ? 'var(--ad-basil)' : 'var(--ad-ember)',
                              }}
                            />
                          </div>
                          <Typography variant="body2" fontWeight="bold" noWrap sx={{ fontSize: { xs: '0.9rem', sm: '0.95rem' } }}>
                            {item.name}
                          </Typography>
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(item._id)}
                          color="error"
                          sx={{ p: 0.5, mt: -0.5, mr: -0.5 }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </div>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ClimateLabel food={item} />
                          {item.calories && (
                            <Typography variant="caption" sx={{ color: 'var(--ad-warn)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              🔥 {item.calories} kcal
                            </Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: 'var(--ad-ember)' }}>
                          {formatINR(getItemTotal(item))}
                        </Typography>
                      </Box>

                      {/* Customizations Accordion Dropdown */}
                      {item.customizations && item.customizations.length > 0 && (
                        <Accordion 
                          sx={{ 
                            marginTop: '12px',
                            boxShadow: 'none',
                            border: `1px solid ${'var(--ad-line)'}`,
                            backgroundColor: 'var(--ad-surface)',
                            '&:before': { display: 'none' },
                            borderRadius: '8px !important',
                          }}
                          defaultExpanded={false}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: 'text.primary' }} />}
                            sx={{
                              backgroundColor: themeMode === 'dark' 
                                ? 'rgba(226, 85, 43, 0.15)'
                                : 'var(--ad-ember-wash)',
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
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ad-ember)', flex: 1 }}>
                                Customizations
                              </Typography>
                              <Chip 
                                label={`${item.customizations.length}/${item.quantity}`}
                                size="small"
                                sx={{
                                  background: '#f2a541',
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
                            backgroundColor: 'var(--ad-surface)',
                          }}>
                            {item.customizations.map((custom, idx) => (
                              <Paper
                                key={idx}
                                elevation={0}
                                sx={{
                                  marginBottom: idx < item.customizations.length - 1 ? '12px' : '0',
                                  padding: '12px',
                                  background: 'var(--ad-bg-2)',
                                  border: `1px solid ${'var(--ad-line)'}`,
                                  borderRadius: '8px',
                                }}
                              >
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: '#e2552b', 
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
                                        border: '1px solid #f2a541',
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
                                            border: '1px solid #f2a541',
                                            color: '#c8451f',
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
                                      color: 'var(--ad-text-3)', 
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
                                  borderColor: '#e2552b',
                                  color: '#e2552b',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: '#f2a541',
                                    background: 'rgba(226, 85, 43, 0.05)',
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
                            marginTop: '8px',
                            borderColor: '#e2552b',
                            color: '#e2552b',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            py: 0.4,
                            px: 1,
                            borderRadius: '6px',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: '#f2a541',
                              background: 'rgba(226, 85, 43, 0.05)',
                            },
                          }}
                        >
                          🎨 Customize This Item
                        </Button>
                      )}

                      {/* Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid var(--ad-line)',
                            borderRadius: '14px',
                            bgcolor: 'var(--ad-surface-2)',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item._id, -1)}
                            sx={{ color: '#e2552b', p: 0.35 }}
                          >
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography
                            sx={{
                              px: 1.25,
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              minWidth: 24,
                              textAlign: 'center',
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item._id, 1)}
                            sx={{ color: '#e2552b', p: 0.35 }}
                          >
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          ₹{item.price} each · Qty: {item.quantity}
                        </Typography>
                      </Box>
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
                  border: '2px solid #f2a541',
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
                        background: 'linear-gradient(135deg, #e2552b, #f2a541)',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f2a541, #e2552b)',
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
                backgroundColor: 'var(--ad-surface)',
                border: '1px solid var(--ad-line)',
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'var(--ad-text)',
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
                        borderColor: '#e2552b',
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
                    background: 'linear-gradient(135deg, #e2552b, #f2a541)',
                    whiteSpace: 'nowrap',
                    minWidth: '100px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f2a541, #e2552b)',
                    },
                    '&:disabled': {
                      background: '#e5e7eb',
                      color: 'var(--ad-text-3)',
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
                  border: '2px dashed #2f7d62',
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
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            p: { xs: 1.75, sm: 2.5 },
            pb: 'max(14px, env(safe-area-inset-bottom, 14px))',
            borderRadius: 'var(--ad-radius-lg) var(--ad-radius-lg) 0 0',
            borderBottom: 0,
            borderTop: '1px solid var(--ad-line)',
            boxShadow: 'var(--ad-shadow)',
            backdropFilter: 'blur(14px)',
            backgroundColor: 'color-mix(in srgb, var(--ad-surface) 94%, transparent)',
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2" fontWeight={600}>{formatINR(getSubtotal())}</Typography>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography variant="body2" color="text.secondary">
                  GST {(GST_RATE * 100).toFixed(0)}% · CGST 2.5% + SGST 2.5%
                </Typography>
                <Typography variant="body2" fontWeight={600}>{formatINR(getTax())}</Typography>
              </div>
              {appliedCoupon && couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Typography color="success.main">Coupon Discount ({appliedCoupon.code})</Typography>
                  <Typography fontWeight="bold" color="success.main">-₹{couponDiscount.toFixed(2)}</Typography>
                </div>
              )}
              <Divider sx={{ my: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)} item
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'} · GST included
                  </Typography>
                </div>
                <Typography
                  sx={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: 'var(--ad-ember)' }}
                >
                  {formatINR(getTotal())}
                </Typography>
              </div>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCheckout}
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1.02rem' }}
              >
                {loading ? (
                  <>
                    <span className="ad-spinner" style={{ marginRight: 10 }} aria-hidden="true" />
                    Placing your order…
                  </>
                ) : (
                  'Checkout'
                )}
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
        PaperProps={{
          sx: {
            m: { xs: 1.5, sm: 2 },
            borderRadius: 'var(--ad-radius)',
            backgroundColor: 'var(--ad-surface)',
            border: '1px solid var(--ad-line)',
          }
        }}
      >
        <DialogTitle sx={{ py: 1.25, px: { xs: 2, sm: 2.5 }, borderBottom: '1px solid var(--ad-line)', fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '1.15rem' }}>
          Complete Your Order
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, mt: 0, backgroundColor: 'var(--ad-surface)' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Your Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Enter your full name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--ad-radius-sm)',
                  '&.Mui-focused fieldset': { borderColor: '#e2552b' },
                },
                '& label.Mui-focused': { color: '#e2552b' },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              placeholder="10-digit number"
              inputProps={{ maxLength: 10 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 'var(--ad-radius-sm)',
                  '&.Mui-focused fieldset': { borderColor: '#e2552b' },
                },
                '& label.Mui-focused': { color: '#e2552b' },
              }}
            />
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Order Type
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
              <Paper
                elevation={0}
                onClick={() => setOrderType('dine-in')}
                sx={{
                  p: 1,
                  px: 1.25,
                  border: orderType === 'dine-in' ? '2px solid #e2552b' : '1px solid var(--ad-line)',
                  borderRadius: 'var(--ad-radius-sm)',
                  bgcolor: orderType === 'dine-in' ? 'var(--ad-ember-wash)' : 'var(--ad-surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <RestaurantIcon sx={{ fontSize: 20, color: orderType === 'dine-in' ? '#e2552b' : 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'var(--ad-text)', lineHeight: 1.2 }}>
                    Dine In
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Eat at table
                  </Typography>
                </Box>
              </Paper>
              <Paper
                elevation={0}
                onClick={() => setOrderType('takeaway')}
                sx={{
                  p: 1,
                  px: 1.25,
                  border: orderType === 'takeaway' ? '2px solid #e2552b' : '1px solid var(--ad-line)',
                  borderRadius: 'var(--ad-radius-sm)',
                  bgcolor: orderType === 'takeaway' ? 'var(--ad-ember-wash)' : 'var(--ad-surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <TakeoutDiningIcon sx={{ fontSize: 20, color: orderType === 'takeaway' ? '#e2552b' : 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'var(--ad-text)', lineHeight: 1.2 }}>
                    Takeaway
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Pick up to go
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>

          {orderType === 'dine-in' && (
            myTable ? (
              <Box
                sx={{
                  mt: 1.25,
                  p: 1,
                  px: 1.5,
                  borderRadius: 'var(--ad-radius-sm)',
                  border: '1px solid var(--ad-line)',
                  bgcolor: 'var(--ad-basil-wash)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Your Assigned Table
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                    Table {myTable.number}
                  </Typography>
                </div>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  Food will be delivered here
                </Typography>
              </Box>
            ) : (
              <TextField
                select
                fullWidth
                size="small"
                label="Select Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                required
                sx={{
                  mt: 1.25,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--ad-radius-sm)',
                    '&.Mui-focused fieldset': { borderColor: '#e2552b' },
                  },
                  '& label.Mui-focused': { color: '#e2552b' },
                }}
              >
                {tables.length === 0 && (
                  <MenuItem value="" disabled>
                    Loading tables…
                  </MenuItem>
                )}
                {tables.map((table) => (
                  <MenuItem key={table.number} value={table.number} disabled={table.isOccupied}>
                    {table.label || `Table ${table.number}`}
                    <Typography component="span" variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                      · {table.isOccupied ? 'Occupied' : `${table.seats} seats`}
                    </Typography>
                  </MenuItem>
                ))}
              </TextField>
            )
          )}

          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Payment Method
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
              <Paper
                elevation={0}
                onClick={() => setPaymentMethod('cash')}
                sx={{
                  p: 1,
                  px: 1.25,
                  border: paymentMethod === 'cash' ? '2px solid #e2552b' : '1px solid var(--ad-line)',
                  borderRadius: 'var(--ad-radius-sm)',
                  bgcolor: paymentMethod === 'cash' ? 'var(--ad-ember-wash)' : 'var(--ad-surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <Radio
                  size="small"
                  checked={paymentMethod === 'cash'}
                  sx={{ p: 0, color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'var(--ad-text)', lineHeight: 1.2 }}>
                    💵 Cash
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Pay upon arrival
                  </Typography>
                </Box>
              </Paper>
              <Paper
                elevation={0}
                onClick={() => setPaymentMethod('online')}
                sx={{
                  p: 1,
                  px: 1.25,
                  border: paymentMethod === 'online' ? '2px solid #e2552b' : '1px solid var(--ad-line)',
                  borderRadius: 'var(--ad-radius-sm)',
                  bgcolor: paymentMethod === 'online' ? 'var(--ad-ember-wash)' : 'var(--ad-surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <Radio
                  size="small"
                  checked={paymentMethod === 'online'}
                  sx={{ p: 0, color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'var(--ad-text)', lineHeight: 1.2 }}>
                    💳 Online
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Card / Net Banking
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Box>

          <Paper 
            sx={{ 
              p: 1.5, 
              mt: 1.5, 
              bgcolor: 'var(--ad-surface-2)',
              border: '1px solid var(--ad-line)',
              borderRadius: 'var(--ad-radius-sm)',
            }}
          >
            <Typography 
              variant="subtitle2" 
              fontWeight="bold" 
              sx={{ 
                color: 'var(--ad-ember)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1,
              }}
            >
              🧾 Order Summary
            </Typography>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Typography variant="caption" color="text.secondary">
                  Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                </Typography>
                <Typography variant="caption" fontWeight="600">{formatINR(getSubtotal())}</Typography>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Typography variant="caption" color="text.secondary">
                  GST {(GST_RATE * 100).toFixed(0)}% (CGST 2.5% + SGST 2.5%)
                </Typography>
                <Typography variant="caption" fontWeight="600">{formatINR(getTax())}</Typography>
              </div>
              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Typography variant="caption" sx={{ color: 'var(--ad-basil)' }}>Coupon Discount</Typography>
                  <Typography variant="caption" fontWeight="600" sx={{ color: 'var(--ad-basil)' }}>-₹{couponDiscount.toFixed(2)}</Typography>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Typography variant="caption" color="text.secondary">
                  Estimated preparation
                </Typography>
                <Typography variant="caption" fontWeight="600">
                  ~{getEstimatedPrepMinutes()} min
                </Typography>
              </div>
              <Divider sx={{ my: 1, borderColor: 'var(--ad-line)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight="bold" sx={{ color: 'var(--ad-text)' }}>Total Amount</Typography>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  sx={{ color: 'var(--ad-ember)' }}
                >
                  {formatINR(getTotal())}
                </Typography>
              </div>
            </div>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, borderTop: '1px solid var(--ad-line)' }}>
          <Button onClick={() => setCheckoutDialogOpen(false)} disabled={loading} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={loading}
            sx={{
              bgcolor: 'var(--ad-ember)',
              color: '#ffffff',
              px: 3,
              py: 1,
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--ad-radius-sm)',
              textTransform: 'none',
              boxShadow: '0 4px 14px rgba(226, 85, 43, 0.4)',
              '&:hover': {
                bgcolor: 'var(--ad-ember-deep)',
              },
            }}
          >
            {loading ? 'Placing Order…' : `Place Order · ${formatINR(getTotal())}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order confirmed */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { overflow: 'hidden' } }}
      >
        <Box
          sx={{
            px: 3,
            pt: 4,
            pb: 3,
            textAlign: 'center',
            position: 'relative',
            background:
              'radial-gradient(90% 90% at 50% 0%, var(--ad-ember-wash), transparent 70%)',
          }}
        >
          <Box
            sx={{
              width: 62,
              height: 62,
              mx: 'auto',
              mb: 2,
              borderRadius: '20px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: 'linear-gradient(150deg, var(--ad-basil), var(--ad-basil-soft))',
              boxShadow: '0 16px 34px -18px rgba(47,125,98,.9)',
              '& svg': { fontSize: 32 },
            }}
          >
            <CheckCircle />
          </Box>

          <Typography className="ad-eyebrow is-basil">Order confirmed</Typography>
          <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 26, mt: 0.75 }}>
            It's with the kitchen
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {orderType === 'dine-in'
              ? `We'll bring it to table ${tableNumber} as soon as it's plated.`
              : "We'll have it boxed and ready for collection shortly."}
          </Typography>
        </Box>

        <DialogContent sx={{ pt: 0 }}>
          <Box
            sx={{
              border: '1px dashed var(--ad-line-strong)',
              borderRadius: 'var(--ad-radius)',
              p: 2,
              textAlign: 'center',
              bgcolor: 'var(--ad-bg-2)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
              Order number
            </Typography>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600, color: 'var(--ad-ember)', my: 0.5 }}>
              {orderNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Keep this to track your order — your e-receipt includes GST.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button fullWidth variant="contained" onClick={handleSuccessClose}>
            Back to the menu
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
            backgroundColor: 'var(--ad-surface)',
            border: '1px solid var(--ad-line)',
          }
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #e2552b, #f2a541)', color: '#fff', fontWeight: 700 }}>
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
        <DialogContent sx={{ mt: 2, backgroundColor: 'var(--ad-surface)' }}>
          {/* Spice Level */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <FormLabel sx={{ fontWeight: 600, color: 'var(--ad-text)', mb: 1 }}>
              🌶️ Spice Level
            </FormLabel>
            <RadioGroup
              value={customization.spiceLevel}
              onChange={(e) => setCustomization({ ...customization, spiceLevel: e.target.value })}
            >
              <FormControlLabel 
                value="mild" 
                control={<Radio sx={{ color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }} />} 
                label="Mild - Just a hint of spice" 
              />
              <FormControlLabel 
                value="medium" 
                control={<Radio sx={{ color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }} />} 
                label="Medium - Balanced heat" 
              />
              <FormControlLabel 
                value="spicy" 
                control={<Radio sx={{ color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }} />} 
                label="Spicy - Hot and flavorful" 
              />
              <FormControlLabel 
                value="extra-spicy" 
                control={<Radio sx={{ color: '#e2552b', '&.Mui-checked': { color: '#e2552b' } }} />} 
                label="Extra Spicy - For heat lovers!" 
              />
            </RadioGroup>
          </FormControl>

          {/* Extras */}
          <div style={{ marginBottom: '24px' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ad-text)', mb: 2 }}>
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
                    border: customization.extras.includes(extra.id) ? '2px solid #e2552b' : `1px solid ${'var(--ad-line)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: customization.extras.includes(extra.id) 
                      ? 'rgba(226, 85, 43, 0.05)' 
                      : 'var(--ad-surface)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#e2552b',
                      background: 'rgba(226, 85, 43, 0.05)',
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
                        border: `2px solid ${customization.extras.includes(extra.id) ? '#e2552b' : '#d1d5db'}`,
                        background: customization.extras.includes(extra.id) ? '#e2552b' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}>
                        {customization.extras.includes(extra.id) && '✓'}
                      </div>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--ad-text)' }}>
                        {extra.label}
                      </Typography>
                    </div>
                    <Chip 
                      label={`+₹${extra.price}`} 
                      size="small" 
                      sx={{ 
                        background: '#2f7d62', 
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
                ? 'linear-gradient(135deg, rgba(226, 85, 43, 0.15) 0%, rgba(242, 165, 65, 0.15) 100%)'
                : '#f0f9ff', 
              border: `1px solid ${'var(--ad-ember)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#c8451f', fontWeight: 600 }}>
                  Extras Total:
                </Typography>
                <Typography variant="h6" sx={{ color: '#c8451f', fontWeight: 700 }}>
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
                  borderColor: '#e2552b',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#e2552b',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, backgroundColor: 'var(--ad-surface)' }}>
          <Button 
            onClick={() => setCustomizeDialogOpen(false)}
            sx={{ 
              flex: 1,
              color: 'var(--ad-text-3)',
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
              background: 'linear-gradient(135deg, #e2552b, #f2a541)',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #f2a541, #e2552b)',
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
              backgroundColor: 'var(--ad-surface)',
              border: '1px solid var(--ad-line)',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #e2552b 0%, #f2a541 100%)', 
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
          <DialogContent sx={{ p: 0, height: '100%', backgroundColor: 'var(--ad-surface)' }}>
            <FoodViewer3D foodItem={selectedFood} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerCart;
