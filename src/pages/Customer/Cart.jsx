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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TakeoutDiningIcon from '@mui/icons-material/TakeoutDining';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { getFoodItems, createOrder } from '../../services/api';

const CustomerCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
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
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

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

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.05; // 5% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
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
            <ShoppingCart style={{ fontSize: 28, color: '#667eea' }} />
          </div>
        </div>
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
          Loading your cart...
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '160px' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container>
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

      <Container sx={{ mt: 3 }}>
        {cartItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
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
            <div>
              {cartItems.map((item) => (
                <Card key={item._id} sx={{ mb: 2 }}>
                  <div style={{ display: 'flex', padding: '16px' }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 80, height: 80, borderRadius: 2 }}
                      image={item.imageUrl || 'https://via.placeholder.com/150?text=Food'}
                      alt={item.name}
                    />
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

                      {/* Customizations Display */}
                      {item.customizations && item.customizations.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '8px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                          {item.customizations.map((custom, idx) => (
                            <div key={idx} style={{ marginBottom: idx < item.customizations.length - 1 ? '8px' : '0' }}>
                              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                                Customization {idx + 1}:
                              </Typography>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                <span style={{ 
                                  fontSize: '11px', 
                                  padding: '2px 8px', 
                                  background: '#fef3c7', 
                                  border: '1px solid #f59e0b', 
                                  borderRadius: '12px',
                                  color: '#92400e',
                                }}>
                                  🌶️ {custom.spiceLevel}
                                </span>
                                {custom.extras && custom.extras.length > 0 && custom.extras.map((extra) => (
                                  <span 
                                    key={extra}
                                    style={{ 
                                      fontSize: '11px', 
                                      padding: '2px 8px', 
                                      background: '#dbeafe', 
                                      border: '1px solid #3b82f6', 
                                      borderRadius: '12px',
                                      color: '#1e40af',
                                    }}
                                  >
                                    {extra.replace('extra-', '').replace('-', ' ')}
                                  </span>
                                ))}
                              </div>
                              {custom.specialInstructions && (
                                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                                  📝 {custom.specialInstructions}
                                </Typography>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
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

            {/* Promo Code */}
            <Paper sx={{ p: 2, mt: 3 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Promo Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(45deg, #ff9a56 30%, #ff6b6b 90%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Apply
                </Button>
              </div>
            </Paper>
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
            p: 3,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <Container>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography>Subtotal</Typography>
                <Typography fontWeight="bold">Rs. {getSubtotal().toFixed(2)}</Typography>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Typography>Tax and fees</Typography>
                <Typography fontWeight="bold">Rs. {getTax().toFixed(2)}</Typography>
              </div>
              <Divider sx={{ my: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Typography variant="h6" fontWeight="bold">
                  Total ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Rs. {getTotal().toFixed(2)}
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
      <Dialog open={checkoutDialogOpen} onClose={() => !loading && setCheckoutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          Complete Your Order
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Your Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            margin="normal"
            required
            placeholder="Enter your full name"
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
          />

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>Order Type</FormLabel>
            <RadioGroup
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <FormControlLabel
                value="dine-in"
                control={<Radio />}
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RestaurantIcon />
                    <span>Dine In</span>
                  </div>
                }
              />
              <FormControlLabel
                value="takeaway"
                control={<Radio />}
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TakeoutDiningIcon />
                    <span>Takeaway</span>
                  </div>
                }
              />
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
            />
          )}

          <FormControl component="fieldset" sx={{ mt: 2, mb: 2, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>Payment Method</FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel
                value="cash"
                control={<Radio />}
                label="Cash on Delivery"
              />
              <FormControlLabel
                value="online"
                control={<Radio />}
                label="Online Payment (UPI/Card/Net Banking)"
              />
            </RadioGroup>
          </FormControl>

          <Paper sx={{ p: 2, mt: 3, background: '#f5f5f5' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Order Summary
            </Typography>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <Typography>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</Typography>
              <Typography>₹{getSubtotal().toFixed(2)}</Typography>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <Typography>Tax (5%)</Typography>
              <Typography>₹{getTax().toFixed(2)}</Typography>
            </div>
            <Divider sx={{ my: 1 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">Total</Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ₹{getTotal().toFixed(2)}
              </Typography>
            </div>
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
              background: 'linear-gradient(45deg, #ff9a56 30%, #ff6b6b 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #ff6b6b 30%, #ff9a56 90%)',
              },
            }}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={handleSuccessClose}>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Order Placed Successfully!
          </Typography>
          <Paper sx={{ p: 2, mt: 2, background: '#f0f7ff' }}>
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
        <DialogActions>
          <Button fullWidth variant="contained" onClick={handleSuccessClose}>
            Back to Menu
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CustomerCart;
