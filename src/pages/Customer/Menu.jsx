import React, { useCallback, useEffect, useState } from 'react';
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
  Stack,
  Box,
} from '@mui/material';
import { Add, Remove, ShoppingCart, Schedule } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getFoodItems } from '../../services/api';
import ClimateLabel from '../../components/food/ClimateLabel';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { SkeletonCards } from '../../components/ui/Loaders';
import { formatINR } from '../../config/business';
import { FONT_DISPLAY } from '../../theme/muiTheme';

const CustomerMenu = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFoodItems = useCallback(async () => {
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
  }, [category]);

  useEffect(() => {
    fetchFoodItems();
    loadCart();
  }, [fetchFoodItems]);


  // The cart is a { foodId: quantity } map in localStorage, which is what the
  // home page writes and the cart page reads. This page used to keep an array
  // here, so anything added from the menu never reached the cart.
  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      setCart(savedCart ? JSON.parse(savedCart) : {});
    } catch {
      setCart({});
    }
  };

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const addToCart = (item) => {
    saveCart({ ...cart, [item._id]: (cart[item._id] || 0) + 1 });
  };

  const removeFromCart = (itemId) => {
    const updatedCart = { ...cart };
    if (updatedCart[itemId] > 1) updatedCart[itemId] -= 1;
    else delete updatedCart[itemId];
    saveCart(updatedCart);
  };

  const getItemQuantity = (itemId) => cart[itemId] || 0;

  const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const categories = ['all', 'Starters', 'Tandoori', 'Indian', 'Special Platter', 'Biryani'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ad-bg)', paddingBottom: 'calc(105px + env(safe-area-inset-bottom, 0px))' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backdropFilter: 'blur(14px)',
          bgcolor: 'color-mix(in srgb, var(--ad-bg) 86%, transparent)',
          borderBottom: '1px solid var(--ad-line)',
        }}
      >
        <Container sx={{ py: 1.75 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '11px',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                flex: 'none',
                background: 'linear-gradient(145deg, var(--ad-ember), var(--ad-saffron))',
              }}
            >
              AR
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, lineHeight: 1.2 }}>
                The menu
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                Every dish carries its climate label
              </Typography>
            </Box>
            <ThemeToggle size="small" />
            <IconButton onClick={() => navigate('/customer/cart')} aria-label="Open cart">
              <Badge badgeContent={getTotalItems()} color="primary">
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Stack>
        </Container>
      </Box>

      <Container sx={{ pt: 3 }}>
        <Tabs
          value={category}
          onChange={(e, v) => setCategory(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            bgcolor: 'var(--ad-surface)',
            border: '1px solid var(--ad-line)',
            borderRadius: 'var(--ad-radius)',
            minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, fontSize: 13.5 },
          }}
        >
          {categories.map((cat) => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>

        {loading ? (
          <SkeletonCards count={6} height={230} columns="repeat(auto-fill, minmax(260px, 1fr))" />
        ) : foodItems.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
              border: '1px dashed var(--ad-line-strong)',
              borderRadius: 'var(--ad-radius-lg)',
            }}
          >
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 21, mb: 0.5 }}>Nothing on this board</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No dishes in this category right now — try another one.
            </Typography>
          </Box>
        ) : (
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
                          background: 'linear-gradient(135deg, var(--ad-basil), var(--ad-basil-soft))',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(47, 125, 98, 0.6)',
                          border: '2px solid var(--ad-surface)',
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
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                      {item.description || 'Delicious food item'}
                    </Typography>

                    {/* What the kitchen needs for this dish, so the wait is
                        known before it is ordered rather than after. */}
                    <Chip
                      icon={<Schedule sx={{ fontSize: 15 }} />}
                      label={`${item.prepTimeMinutes ?? 15} min to prepare`}
                      size="small"
                      sx={{
                        mb: 1.5,
                        bgcolor: 'var(--ad-saffron-wash)',
                        color: 'var(--ad-warn)',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />

                    <Box sx={{ mb: 1.75 }}>
                      <ClimateLabel food={item} />
                    </Box>

                    <Typography
                      sx={{
                        fontFamily: FONT_DISPLAY,
                        fontSize: 21,
                        fontWeight: 600,
                        color: 'var(--ad-ember)',
                        mb: 1.75,
                      }}
                    >
                      {formatINR(item.price, false)}
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
        )}
      </Container>

      {getTotalItems() > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'color-mix(in srgb, var(--ad-surface) 92%, transparent)',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid var(--ad-line)',
            padding: '14px 0',
            paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
            zIndex: 30,
          }}
        >
          <Container>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/customer/cart')}

            >
              View cart · {getTotalItems()} item{getTotalItems() === 1 ? '' : 's'}
            </Button>
          </Container>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
