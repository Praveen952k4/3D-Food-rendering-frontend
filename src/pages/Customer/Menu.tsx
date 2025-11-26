import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add, Remove, ShoppingCart, Restaurant } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getFoodItems } from '../../services/api';

const CustomerMenu: React.FC = () => {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFoodItems();
    loadCart();
  }, [category]);

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const params = category === 'all' ? {} : { category };
      const response = await getFoodItems(params.category);
      setFoodItems(response.data.foodItems);
    } catch (error) {
      console.error('Failed to fetch food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (updatedCart: any[]) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map((cartItem) =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...cart, { ...item, quantity: 1 }];
    }

    saveCart(updatedCart);
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find((cartItem) => cartItem._id === itemId);
    let updatedCart;

    if (existingItem && existingItem.quantity > 1) {
      updatedCart = cart.map((cartItem) =>
        cartItem._id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    } else {
      updatedCart = cart.filter((cartItem) => cartItem._id !== itemId);
    }

    saveCart(updatedCart);
  };

  const getItemQuantity = (itemId: string) => {
    const item = cart.find((cartItem) => cartItem._id === itemId);
    return item?.quantity || 0;
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const categories = ['all', 'Starters', 'Tandoori', 'Indian', 'Special Platter', 'Biryani'];

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
          Loading menu...
        </Typography>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '80px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px 0',
          marginBottom: '24px',
        }}
      >
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight="bold">
              AR Food Menu
            </Typography>
            <IconButton
              color="inherit"
              onClick={() => navigate('/customer/cart')}
              sx={{ position: 'relative' }}
            >
              <Badge badgeContent={getTotalItems()} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Stack>
        </Container>
      </div>

      <Container>
        <Tabs
          value={category}
          onChange={(e, v) => setCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, backgroundColor: 'white', borderRadius: 2 }}
        >
          {categories.map((cat) => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          {foodItems.map((item) => {
            const quantity = getItemQuantity(item._id);

            return (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.imageUrl || 'https://via.placeholder.com/300x200?text=Food+Item'}
                      alt={item.name}
                    />
                    {quantity > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.6)',
                          border: '2px solid white',
                          zIndex: 10,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {quantity}
                        </Typography>
                      </div>
                    )}
                  </div>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.isVeg ? 'Veg' : 'Non-Veg'}
                        color={item.isVeg ? 'success' : 'error'}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {item.description || 'Delicious food item'}
                    </Typography>
                    <Typography variant="h6" color="primary" mb={2}>
                      ₹{item.price.toFixed(2)}
                    </Typography>

                    {quantity === 0 ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => addToCart(item)}
                      >
                        Add to Cart
                      </Button>
                    ) : (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <IconButton onClick={() => removeFromCart(item._id)} color="primary">
                          <Remove />
                        </IconButton>
                        <Typography variant="h6">{quantity}</Typography>
                        <IconButton onClick={() => addToCart(item)} color="primary">
                          <Add />
                        </IconButton>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {getTotalItems() > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
            padding: '16px',
          }}
        >
          <Container>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/customer/cart')}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              }}
            >
              View Cart ({getTotalItems()} items)
            </Button>
          </Container>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
