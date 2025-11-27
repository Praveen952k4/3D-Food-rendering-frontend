import React, { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Divider,
  Drawer,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFoodItems } from '../../services/api';

// 3D Model Component
const Model = ({ modelUrl }) => {
  const gltf = useGLTF(modelUrl, true);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  return <primitive object={scene} dispose={null} />;
};

// Sphere Animation Loader Component
const SphereLoader = ({ isDark }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px' }}>
      <div className="sphere-loader">
        <div className="sphere"></div>
        <div className="sphere"></div>
        <div className="sphere"></div>
      </div>
      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
        Loading menu...
      </Typography>
    </div>
  );
};

// Interactive GLB Viewer
const GLBViewer = ({ modelUrl }) => {
  if (!modelUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '0.9rem',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '24px',
        }}
      >
        No 3D model available
      </div>
    );
  }

  return (
    <Canvas 
      style={{ width: '100%', height: '100%', touchAction: 'none' }} 
      camera={{ position: [0, 1, 4], fov: 50 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} />
      <spotLight position={[0, 10, 0]} intensity={1.5} angle={0.3} penumbra={1} />
      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#667eea" wireframe />
          </mesh>
        }
      >
        <Model modelUrl={modelUrl} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls 
        enablePan={true} 
        enableZoom={true} 
        enableRotate={true}
        minDistance={1.5} 
        maxDistance={10}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
      />
    </Canvas>
  );
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activePreviewFood, setActivePreviewFood] = useState(null);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [allItemsDrawerOpen, setAllItemsDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegFilter, setVegFilter] = useState('all');
  const [themeMode, setThemeMode] = useState('light');
  const [quantity, setQuantity] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);

  // Hide splash after 10s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch food items
  useEffect(() => {
    const fetchFoods = async () => {
      setLoadingFoods(true);
      try {
        const response = await getFoodItems();
        const items = response.data.foodItems || [];
        setFoodItems(items);
        setFilteredItems(items);
        if (items.length > 0) {
          setActivePreviewFood(items[0]);
        }
      } catch (error) {
        console.error('Failed to load foods', error);
      } finally {
        setLoadingFoods(false);
      }
    };

    fetchFoods();
  }, []);

  // Filter by category
  useEffect(() => {
    let filtered = foodItems;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    
    // Filter by veg/non-veg
    if (vegFilter === 'veg') {
      filtered = filtered.filter((item) => item.isVeg === true);
    } else if (vegFilter === 'non-veg') {
      filtered = filtered.filter((item) => item.isVeg === false);
    }
    
    setFilteredItems(filtered);
  }, [foodItems, selectedCategory, vegFilter]);

  // Theme palette
  const palette = useMemo(
    () =>
      themeMode === 'dark'
        ? {
            background: '#0a0a0a',
            surface: 'rgba(255,255,255,0.06)',
            border: 'rgba(255,255,255,0.08)',
            textPrimary: '#FFFFFF',
            textSecondary: 'rgba(255,255,255,0.7)',
          }
        : {
            background: '#f8f9fb',
            surface: '#FFFFFF',
            border: '#e5e7eb',
            textPrimary: '#1f2937',
            textSecondary: '#6b7280',
          },
    [themeMode]
  );

  // Categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    foodItems.forEach((item) => uniqueCategories.add(item.category || 'General'));
    return ['All', ...Array.from(uniqueCategories)];
  }, [foodItems]);

  // Displayed food items based on active category filter
  const displayedFoodItems = useMemo(() => {
    if (activeCategory === 'All') return foodItems;
    return foodItems.filter((item) => item.category === activeCategory);
  }, [foodItems, activeCategory]);

  // Cart count
  const cartCount = useMemo(() => {
    const saved = localStorage.getItem('cart');
    if (!saved) return 0;
    try {
      const cart = JSON.parse(saved);
      return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
    } catch {
      return 0;
    }
  }, [cartVersion]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const addToCart = useCallback(
    (foodId, amount = 1) => {
      if (!foodId || amount <= 0) return;
      const saved = localStorage.getItem('cart');
      const cart = saved ? JSON.parse(saved) : {};
      cart[foodId] = (cart[foodId] || 0) + amount;
      localStorage.setItem('cart', JSON.stringify(cart));
      setCartVersion((prev) => prev + 1);
      // Update quantity state if the current item is being added
      if (activePreviewFood?._id === foodId) {
        setQuantity(cart[foodId]);
      }
    },
    [activePreviewFood]
  );

  const handleFoodSelection = useCallback((food) => {
    setActivePreviewFood(food);
    // Check if item is already in cart and set quantity accordingly
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        const cart = JSON.parse(saved);
        const itemQuantity = cart[food._id] || 0;
        setQuantity(itemQuantity);
      } catch {
        setQuantity(0);
      }
    } else {
      setQuantity(0);
    }
  }, []);

  // Infinite scroll: Create duplicated items for seamless loop
  const [duplicatedItems, setDuplicatedItems] = React.useState([]);
  
  useEffect(() => {
    if (filteredItems.length > 0) {
      // Duplicate items 3 times for infinite scroll effect
      const duplicated = [...filteredItems, ...filteredItems, ...filteredItems];
      setDuplicatedItems(duplicated);
    }
  }, [filteredItems]);

  // Auto-scroll carousel to center selected item
  useEffect(() => {
    if (activePreviewFood && duplicatedItems.length > 0) {
      const carousel = document.getElementById('food-carousel-container');
      if (!carousel) return;

      // Find the middle set item (index = filteredItems.length to filteredItems.length * 2 - 1)
      const middleSetStartIndex = filteredItems.length;
      const itemIndex = filteredItems.findIndex(f => f._id === activePreviewFood._id);
      const targetIndex = middleSetStartIndex + itemIndex;
      
      const selectedItem = document.querySelectorAll('.carousel-item-wrapper')[targetIndex];
      if (selectedItem) {
        const carouselRect = carousel.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        const scrollLeft = itemRect.left - carouselRect.left - (carouselRect.width / 2) + (itemRect.width / 2) + carousel.scrollLeft;
        carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activePreviewFood, duplicatedItems, filteredItems]);

  // Auto-select centered item on scroll with infinite loop
  useEffect(() => {
    const carousel = document.getElementById('food-carousel-container');
    if (!carousel || duplicatedItems.length === 0) return;

    let isScrolling;
    let lastScrollLeft = carousel.scrollLeft;

    const handleScroll = () => {
      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenter = carouselRect.left + carouselRect.width / 2;

      let closestItem = null;
      let closestDistance = Infinity;
      let closestIndex = -1;

      const items = document.querySelectorAll('.carousel-item-wrapper');
      items.forEach((itemElement, idx) => {
        const itemRect = itemElement.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(carouselCenter - itemCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestItem = itemElement;
          closestIndex = idx;
        }
      });

      if (closestItem && closestIndex >= 0) {
        const actualIndex = closestIndex % filteredItems.length;
        const food = filteredItems[actualIndex];
        
        if (food && food._id !== activePreviewFood?._id) {
          setActivePreviewFood(food);
          const saved = localStorage.getItem('cart');
          if (saved) {
            try {
              const cart = JSON.parse(saved);
              const itemQuantity = cart[food._id] || 0;
              setQuantity(itemQuantity);
            } catch {
              setQuantity(0);
            }
          } else {
            setQuantity(0);
          }
        }
      }

      // Clear previous timeout
      clearTimeout(isScrolling);
      
      // Detect boundaries and reposition after scroll stops
      isScrolling = setTimeout(() => {
        const itemWidth = 90; // Approximate item width with gap
        const setWidth = filteredItems.length * itemWidth;
        const scrollPos = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;

        // If scrolled into first set, jump to second set (seamless)
        if (scrollPos < setWidth * 0.3) {
          carousel.scrollLeft = scrollPos + setWidth;
        }
        // If scrolled into third set, jump back to second set (seamless)
        else if (scrollPos > setWidth * 2.7 || scrollPos >= maxScroll - 100) {
          carousel.scrollLeft = scrollPos - setWidth;
        }
      }, 100);
    };

    let scrollTimeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 20);
    };

    carousel.addEventListener('scroll', debouncedScroll);
    
    // Initialize scroll position to middle set
    setTimeout(() => {
      const itemWidth = 90;
      const setWidth = filteredItems.length * itemWidth;
      carousel.scrollLeft = setWidth;
    }, 100);

    return () => {
      carousel.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimeout);
      clearTimeout(isScrolling);
    };
  }, [duplicatedItems, filteredItems, activePreviewFood]);

  return (
    <div
      style={{
        backgroundColor: palette.background,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Splash Screen */}
      {showSplash && (
        <div className="splash-overlay">
          <div className="splash-content">
            <Typography className="splash-kicker" variant="caption">
              Welcome to AR Food Experience
            </Typography>
            <Typography className="splash-title" variant="h3">
              Have the <span>Healthy Food</span>
            </Typography>
            <Typography className="splash-subtitle" variant="h4">
              and have fun!
            </Typography>
            <div style={{ marginTop: '24px' }}>
              <SphereLoader isDark={themeMode === 'dark'} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: palette.background,
          color: palette.textPrimary,
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 120,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <Typography variant="h6" fontWeight={800}>
              AR Food Menu
            </Typography>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>
              Explore dishes in 3D
            </Typography>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                backgroundColor: palette.surface,
                color: palette.textPrimary,
                padding: '8px',
                '&:hover': { backgroundColor: palette.surface, opacity: 0.8 },
              }}
              title="Toggle theme"
            >
              {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
            <IconButton
              onClick={() => setMenuDrawerOpen(true)}
              sx={{
                backgroundColor: palette.surface,
                color: palette.textPrimary,
                padding: '8px',
                '&:hover': { backgroundColor: palette.surface, opacity: 0.8 },
              }}
              title="Menu card"
            >
              <MenuBookIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleLogout}
              sx={{
                backgroundColor: palette.surface,
                color: palette.textPrimary,
                padding: '8px',
                '&:hover': { backgroundColor: palette.surface, opacity: 0.8 },
              }}
              title="Logout"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen 3D Viewer */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 80px - 130px)' }}>
        {activePreviewFood && (
          <>
            {/* 3D GLB Viewer - Full Screen */}
            <div style={{ width: '100%', height: '100%' }}>
              <GLBViewer modelUrl={activePreviewFood.modelUrl} />
              {/* Food Info Overlay - Top Left */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: themeMode === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  maxWidth: '200px',
                  boxShadow: themeMode === 'dark' ? '0 4px 16px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: palette.textPrimary, marginBottom: '2px', fontSize: '0.75rem' }}>
                  {activePreviewFood.name}
                </Typography>
                <Typography variant="caption" sx={{ color: palette.textSecondary, marginBottom: '4px', fontSize: '0.65rem', display: 'block' }}>
                  {activePreviewFood.description || 'Interactive 3D Model'}
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '0.9rem',
                  }}
                >
                  ₹{activePreviewFood.price}
                </Typography>
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loadingFoods && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
            <SphereLoader isDark={themeMode === 'dark'} />
          </div>
        )}
      </div>

    {/* Bottom Footer with Scrolling Carousel */}
{!loadingFoods && filteredItems.length > 0 && (
  <div
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '130px',
      background:
        themeMode === 'dark'
          ? 'rgba(10, 10, 10, 0.98)'
          : 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(30px)',
      borderTop: `1px solid ${palette.border}`,
      zIndex: 100,
      boxShadow:
        themeMode === 'dark'
          ? '0 -8px 32px rgba(0,0,0,0.6)'
          : '0 -4px 16px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
    }}
  >
    {/* LEFT: Minus Placeholder / Button */}
    <div
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {activePreviewFood && quantity > 0 ? (
        <IconButton
          onClick={() => {
            if (quantity > 1) {
              const newQty = quantity - 1;
              setQuantity(newQty);
              const cart = JSON.parse(localStorage.getItem('cart') || '{}');
              cart[activePreviewFood._id] = newQty;
              localStorage.setItem('cart', JSON.stringify(cart));
              setCartVersion((prev) => prev + 1);
            } else if (quantity === 1) {
              const cart = JSON.parse(localStorage.getItem('cart') || '{}');
              delete cart[activePreviewFood._id];
              localStorage.setItem('cart', JSON.stringify(cart));
              setQuantity(0);
              setCartVersion((prev) => prev + 1);
            }
          }}
          sx={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            width: '32px',
            height: '32px',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              transform: 'scale(1.1)',
            },
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          <RemoveIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      ) : (
        // Placeholder when minus hidden
        <div style={{ width: '32px', height: '32px' }}></div>
      )}
    </div>

    {/* CENTER: Food Scrolling Carousel */}
    <div
      id="food-carousel-container"
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: 1,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', // Hide scrollbar for cleaner infinite loop
        msOverflowStyle: 'none', // Hide scrollbar for IE
      }}
      className="food-carousel-scroll"
    >
      {(duplicatedItems.length > 0 ? duplicatedItems : filteredItems).map((food, idx) => {
        const isActive = activePreviewFood?._id === food._id;
        
        // Get quantity for this food item from cart
        const saved = localStorage.getItem('cart');
        let itemQuantity = 0;
        if (saved) {
          try {
            const cart = JSON.parse(saved);
            itemQuantity = cart[food._id] || 0;
          } catch {
            itemQuantity = 0;
          }
        }

        return (
          <div
            key={`${food._id}-${idx}`}
            className="carousel-item-wrapper"
            onClick={() => handleFoodSelection(food)}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              minWidth: isActive ? '90px' : '70px',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isActive ? 'scale(1.2)' : 'scale(1)',
              opacity: isActive ? 1 : 0.7,
              position: 'relative',
            }}
          >
            {/* IMAGE CIRCLE */}
            <div
              style={{
                width: isActive ? '70px' : '56px',
                height: isActive ? '70px' : '56px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: isActive
                  ? '3px solid transparent'
                  : `2px solid ${palette.border}`,
                background: isActive
                  ? 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea, #764ba2) border-box'
                  : palette.surface,
                boxShadow: isActive
                  ? '0 8px 24px rgba(102, 126, 234, 0.7), 0 0 0 4px rgba(102, 126, 234, 0.2)'
                  : themeMode === 'dark'
                  ? '0 3px 10px rgba(0,0,0,0.5)'
                  : '0 2px 6px rgba(0,0,0,0.15)',
                position: 'relative',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <img
                src={food.imageUrl || 'https://via.placeholder.com/80?text=Food'}
                alt={food.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* VEG / NON-VEG MARKER */}
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  right: '3px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${food.isVeg ? '#10b981' : '#ef4444'}`,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: food.isVeg ? '#10b981' : '#ef4444',
                  }}
                />
              </div>

              {/* 3D MODEL BADGE */}
              {food.modelUrl && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(102, 126, 234, 0.95)',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ViewInArIcon sx={{ fontSize: '12px', color: '#fff' }} />
                </div>
              )}
              
              {/* QUANTITY BADGE */}
              {itemQuantity > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
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
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {itemQuantity}
                  </Typography>
                </div>
              )}
            </div>

            {/* FOOD NAME */}
            <Typography
              variant="caption"
              fontWeight={isActive ? 700 : 600}
              noWrap
              sx={{
                color: isActive
                  ? themeMode === 'dark'
                    ? '#667eea'
                    : '#764ba2'
                  : palette.textPrimary,
                fontSize: '0.65rem',
                maxWidth: '100%',
                textAlign: 'center',
              }}
            >
              {food.name}
            </Typography>
          </div>
        );
      })}
    </div>

    {/* RIGHT: PLUS BUTTON */}
    {activePreviewFood && (
      <IconButton
        onClick={() => {
          const newQty = Math.min(99, quantity + 1);
          setQuantity(newQty);
          const cart = JSON.parse(localStorage.getItem('cart') || '{}');
          cart[activePreviewFood._id] = newQty;
          localStorage.setItem('cart', JSON.stringify(cart));
          setCartVersion((prev) => prev + 1);
        }}
        sx={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          width: '32px',
          height: '32px',
          minWidth: '32px',
          flexShrink: 0,
          '&:hover': {
            background: 'linear-gradient(135deg, #059669, #047857)',
            transform: 'scale(1.1)',
          },
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.3s ease',
        }}
      >
        <AddIcon sx={{ fontSize: '16px' }} />
      </IconButton>
    )}
  </div>
)}

      {/* Floating Cart & Theme Button - Top Right */}
      {!loadingFoods && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Order History Button */}
          <Fab
            size="small"
            onClick={() => navigate('/customer/orders')}
            sx={{
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              color: '#fff',
              width: '48px',
              height: '48px',
              boxShadow: '0 4px 16px rgba(240, 147, 251, 0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                transform: 'scale(1.08)',
                boxShadow: '0 8px 20px rgba(240, 147, 251, 0.7)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <HistoryIcon sx={{ fontSize: 20 }} />
          </Fab>

          {/* View Cart Button */}
          <Fab
            size="small"
            onClick={() => navigate('/customer/cart')}
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              width: '48px',
              height: '48px',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
                transform: 'scale(1.08)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.7)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="View Cart"
          >
            <Badge
              badgeContent={cartCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: '18px',
                  minWidth: '18px',
                  borderRadius: '9px',
                  fontWeight: 700,
                  top: 2,
                  right: 2,
                },
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: '24px' }} />
            </Badge>
          </Fab>

          {/* All Items Menu Button */}
          <Fab
            size="small"
            onClick={() => setAllItemsDrawerOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              width: '48px',
              height: '48px',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                transform: 'scale(1.08)',
              },
              transition: 'all 0.3s ease',
            }}
            title="View All Items"
          >
            <RestaurantMenuIcon sx={{ fontSize: '24px' }} />
          </Fab>

          {/* Filter Button */}
          <Fab
            size="small"
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              width: '48px',
              height: '48px',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9, #5b21b6)',
                transform: 'scale(1.08)',
              },
              transition: 'all 0.3s ease',
            }}
            title="Filter by Category"
          >
            <FilterListIcon sx={{ fontSize: '24px' }} />
          </Fab>
        </div>
      )}

      {/* Menu Drawer */}
      <Drawer
        anchor="right"
        open={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: 420 },
            backgroundColor: themeMode === 'dark' ? '#0f0f0f' : '#ffffff',
            color: palette.textPrimary,
          },
        }}
      >
        <div style={{ padding: '24px 20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <Typography variant="h6" fontWeight={700}>
                Menu Card
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                {foodItems.length} curated dishes
              </Typography>
            </div>
            <IconButton onClick={() => setMenuDrawerOpen(false)} sx={{ color: palette.textPrimary }}>
              <CloseIcon />
            </IconButton>
          </div>
          <List sx={{ overflowY: 'auto', flex: 1 }}>
            {foodItems.map((food, index) => {
              // Get quantity for this food item from cart
              const saved = localStorage.getItem('cart');
              let itemQuantity = 0;
              if (saved) {
                try {
                  const cart = JSON.parse(saved);
                  itemQuantity = cart[food._id] || 0;
                } catch {
                  itemQuantity = 0;
                }
              }
              
              return (
              <React.Fragment key={food._id}>
                <ListItem alignItems="flex-start" sx={{ gap: 1, paddingY: 1.5 }}>
                  <ListItemAvatar sx={{ position: 'relative' }}>
                    <Avatar
                      variant="rounded"
                      src={food.imageUrl || 'https://via.placeholder.com/80?text=Food'}
                      alt={food.name}
                      sx={{ width: 56, height: 56, borderRadius: '12px' }}
                    />
                    {itemQuantity > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
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
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {itemQuantity}
                        </Typography>
                      </div>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {food.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                        ₹{food.price} · {food.category}
                      </Typography>
                    }
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        handleFoodSelection(food);
                        setMenuDrawerOpen(false);
                      }}
                      sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff' }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => addToCart(food._id)}
                      sx={{
                        color: palette.textPrimary,
                        borderColor: palette.border,
                        '&:hover': { borderColor: '#667eea' },
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </ListItem>
                {index < foodItems.length - 1 && <Divider sx={{ borderColor: palette.border }} />}
              </React.Fragment>
            );
            })}
          </List>
        </div>
      </Drawer>

      {/* All Items Drawer with Categories */}
      <Drawer
        anchor="bottom"
        open={allItemsDrawerOpen}
        onClose={() => setAllItemsDrawerOpen(false)}
        PaperProps={{
          sx: {
            height: '90vh',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            background: palette.surface,
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <Typography variant="h5" fontWeight={700} sx={{ color: palette.textPrimary }}>
                All Menu Items
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary, marginTop: '4px' }}>
                {foodItems.length} items available
              </Typography>
            </div>
            <IconButton onClick={() => setAllItemsDrawerOpen(false)} sx={{ color: palette.textPrimary }}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Chip
              label="All"
              onClick={() => setActiveCategory('All')}
              sx={{
                backgroundColor: activeCategory === 'All' ? '#667eea' : palette.surface,
                color: activeCategory === 'All' ? '#fff' : palette.textPrimary,
                border: `1px solid ${activeCategory === 'All' ? '#667eea' : palette.border}`,
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: activeCategory === 'All' ? '#764ba2' : palette.background,
                },
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setActiveCategory(cat)}
                sx={{
                  backgroundColor: activeCategory === cat ? '#667eea' : palette.surface,
                  color: activeCategory === cat ? '#fff' : palette.textPrimary,
                  border: `1px solid ${activeCategory === cat ? '#667eea' : palette.border}`,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  '&:hover': {
                    backgroundColor: activeCategory === cat ? '#764ba2' : palette.background,
                  },
                }}
              />
            ))}
          </div>

          {/* Food Items Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
            gap: '16px', 
            overflowY: 'auto',
            flex: 1,
          }}>
            {displayedFoodItems.map((food) => {
              // Get quantity for this food item from cart
              const saved = localStorage.getItem('cart');
              let itemQuantity = 0;
              if (saved) {
                try {
                  const cart = JSON.parse(saved);
                  itemQuantity = cart[food._id] || 0;
                } catch {
                  itemQuantity = 0;
                }
              }
              
              return (
              <div
                key={food._id}
                style={{
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => {
                  handleFoodSelection(food);
                  setAllItemsDrawerOpen(false);
                }}
              >
                <div style={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
                  <img
                    src={food.imageUrl || 'https://via.placeholder.com/200?text=Food'}
                    alt={food.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div className={`veg-indicator ${food.isVeg ? 'veg' : 'non-veg'}`}>
                    <span></span>
                  </div>
                  {food.modelUrl && (
                    <div className="view-3d-chip">
                      <ViewInArIcon sx={{ fontSize: '16px' }} />
                    </div>
                  )}
                  {itemQuantity > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
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
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          lineHeight: 1,
                        }}
                      >
                        {itemQuantity}
                      </Typography>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px' }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight={600} 
                    noWrap
                    sx={{ color: palette.textPrimary, marginBottom: '4px' }}
                  >
                    {food.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: palette.textSecondary, display: 'block', marginBottom: '8px' }}
                  >
                    {food.category}
                  </Typography>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={700} 
                      sx={{ color: '#667eea' }}
                    >
                      ₹{food.price}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(food._id);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        padding: '6px',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        },
                      }}
                    >
                      <AddIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '280px',
            background: palette.surface,
            padding: '24px',
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: palette.textPrimary }}>
              Filters
            </Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ color: palette.textPrimary }}>
              <CloseIcon />
            </IconButton>
          </div>

          {/* Veg/Non-Veg Filter */}
          <div style={{ marginBottom: '24px' }}>
            <Typography variant="caption" fontWeight={600} sx={{ color: palette.textSecondary, display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Food Type
            </Typography>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Chip
                label="All"
                onClick={() => setVegFilter('all')}
                sx={{
                  flex: 1,
                  backgroundColor: vegFilter === 'all' ? '#667eea' : palette.surface,
                  color: vegFilter === 'all' ? '#fff' : palette.textPrimary,
                  border: `1px solid ${vegFilter === 'all' ? '#667eea' : palette.border}`,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: vegFilter === 'all' ? '#764ba2' : palette.background,
                  },
                }}
              />
              <Chip
                label="🟢 Veg"
                onClick={() => setVegFilter('veg')}
                sx={{
                  flex: 1,
                  backgroundColor: vegFilter === 'veg' ? '#10b981' : palette.surface,
                  color: vegFilter === 'veg' ? '#fff' : palette.textPrimary,
                  border: `1px solid ${vegFilter === 'veg' ? '#10b981' : palette.border}`,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: vegFilter === 'veg' ? '#059669' : palette.background,
                  },
                }}
              />
              <Chip
                label="🔴 Non-Veg"
                onClick={() => setVegFilter('non-veg')}
                sx={{
                  flex: 1,
                  backgroundColor: vegFilter === 'non-veg' ? '#ef4444' : palette.surface,
                  color: vegFilter === 'non-veg' ? '#fff' : palette.textPrimary,
                  border: `1px solid ${vegFilter === 'non-veg' ? '#ef4444' : palette.border}`,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: vegFilter === 'non-veg' ? '#dc2626' : palette.background,
                  },
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <Typography variant="caption" fontWeight={600} sx={{ color: palette.textSecondary, display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Category
          </Typography>
          {/* Category List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              fullWidth
              variant={selectedCategory === 'All' ? 'contained' : 'outlined'}
              onClick={() => {
                setSelectedCategory('All');
                setFilterDrawerOpen(false);
              }}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                background: selectedCategory === 'All' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                color: selectedCategory === 'All' ? '#fff' : palette.textPrimary,
                borderColor: palette.border,
                '&:hover': {
                  background: selectedCategory === 'All' ? 'linear-gradient(135deg, #764ba2, #667eea)' : palette.background,
                },
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: selectedCategory === 'All' ? 700 : 500,
              }}
            >
              All Items
            </Button>
            {categories.filter(cat => cat !== 'All').map((category) => (
              <Button
                key={category}
                fullWidth
                variant={selectedCategory === category ? 'contained' : 'outlined'}
                onClick={() => {
                  setSelectedCategory(category);
                  setFilterDrawerOpen(false);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  background: selectedCategory === category ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                  color: selectedCategory === category ? '#fff' : palette.textPrimary,
                  borderColor: palette.border,
                  '&:hover': {
                    background: selectedCategory === category ? 'linear-gradient(135deg, #764ba2, #667eea)' : palette.background,
                  },
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: selectedCategory === category ? 700 : 500,
                }}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Active Filter Info */}
          {(selectedCategory !== 'All' || vegFilter !== 'all') && (
            <div
              style={{
                marginTop: 'auto',
                padding: '16px',
                background: themeMode === 'dark' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                border: `1px solid ${themeMode === 'dark' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
              }}
            >
              <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', marginBottom: '4px' }}>
                Active Filters:
              </Typography>
              {vegFilter !== 'all' && (
                <Typography variant="body2" fontWeight={600} sx={{ color: palette.textPrimary }}>
                  {vegFilter === 'veg' ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
                </Typography>
              )}
              {selectedCategory !== 'All' && (
                <Typography variant="body2" fontWeight={600} sx={{ color: palette.textPrimary }}>
                  {selectedCategory}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: palette.textSecondary, marginTop: '8px', display: 'block' }}>
                {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
              </Typography>
            </div>
          )}
        </div>
      </Drawer>

      {/* Styles */}
      <style>{`
        .veg-indicator {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
        }
        .veg-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: block;
        }
        .veg-indicator.veg {
          border-color: #10b981;
        }
        .veg-indicator.veg span {
          background: #10b981;
        }
        .veg-indicator.non-veg {
          border-color: #ef4444;
        }
        .veg-indicator.non-veg span {
          background: #ef4444;
        }
        .view-3d-chip {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(102, 126, 234, 0.95);
          padding: 6px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
        .splash-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top, rgba(102,126,234,0.4), rgba(0,0,0,0.95)), #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 2000;
          animation: splashFadeIn 0.5s ease forwards;
        }
        .splash-content {
          max-width: 420px;
          text-align: center;
          color: #fff;
          animation: floatUp 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .splash-kicker {
          letter-spacing: 0.35em;
          text-transform: uppercase;
          opacity: 0.7;
          display: block;
          margin-bottom: 12px;
        }
        .splash-title {
          font-weight: 800 !important;
          font-size: clamp(2.2rem, 6vw, 3.8rem) !important;
          line-height: 1.1 !important;
          margin-bottom: 8px !important;
        }
        .splash-title span {
          display: inline-block;
          background: linear-gradient(120deg, #ff9a9e, #fad0c4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glowPulse 2s ease-in-out infinite;
        }
        .splash-subtitle {
          font-size: clamp(1.4rem, 4vw, 2.4rem) !important;
          font-weight: 600 !important;
          letter-spacing: 0.1em;
          margin-bottom: 16px !important;
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
          0%,100% { filter: drop-shadow(0 0 8px rgba(255,255,255,0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(255,255,255,0.9)); }
        }
        .food-carousel-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .food-carousel-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 3px;
        }
        .food-carousel-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 3px;
        }
        .food-carousel-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2, #667eea);
        }
        
        /* Sphere Loader Animation */
        .sphere-loader {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
        }
        .sphere-loader .sphere {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          animation: sphereBounce 1.4s infinite ease-in-out both;
        }
        .sphere-loader .sphere:nth-child(1) {
          animation-delay: -0.32s;
        }
        .sphere-loader .sphere:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes sphereBounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerHome;
