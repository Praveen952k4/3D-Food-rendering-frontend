import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CameraIcon from '@mui/icons-material/Camera';
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "32px",
      }}
    >
      <div className="sphere-loader">
        <div className="sphere"></div>
        <div className="sphere"></div>
        <div className="sphere"></div>
      </div>
      <Typography
        variant="body2"
        sx={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}
      >
        Loading menu...
      </Typography>
    </div>
  );
};

// Camera + 3D GLB Model Overlay Component
const CameraWith3D = ({ videoRef, glbModelUrl }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const controlsRef = useRef(null);
  const animationIdRef = useRef(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !glbModelUrl) {
      setModelLoading(false);
      return;
    }

    setModelLoading(true);
    setModelError(null);

    // Initialize Three.js Scene
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Scene setup
    const scene = new window.THREE.Scene();
    scene.background = null; // Transparent background to show camera below
    sceneRef.current = scene;

    // Camera setup
    const camera = new window.THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 3);

    // Renderer setup (transparent)
    const renderer = new window.THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load GLB Model
    // Use THREE.GLTFLoader if available, fallback to window.GLTFLoader
    const GLTFLoaderClass = window.THREE?.GLTFLoader || window.GLTFLoader;
    if (!GLTFLoaderClass) {
      console.error("GLTFLoader not loaded");
      setModelError("3D loader not available");
      setModelLoading(false);
      return;
    }
    const loader = new GLTFLoaderClass();

    // Shared success handler for parsed GLTF
    const handleGltfLoad = (gltf) => {
      const model = gltf.scene;

      // Compute bounding box and center the model
      const bbox = new window.THREE.Box3().setFromObject(model);
      const size = bbox.getSize(new window.THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // If the model has a size of 0 (edge case), fall back to a reasonable scale
      const safeMax = maxDim > 0 ? maxDim : 1;

      // Determine a scale so model fits comfortably in view. Adjust factor for mobile.
      const isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;
      const fitFactor = isMobile ? 1.0 : 1.6;
      const scale = (1.0 / safeMax) * fitFactor;
      model.scale.multiplyScalar(scale);

      // Recalculate bbox after scaling
      const bboxScaled = new window.THREE.Box3().setFromObject(model);
      const center = bboxScaled.getCenter(new window.THREE.Vector3());
      // Move model so its center is at origin
      model.position.sub(center);

      scene.add(model);
      modelRef.current = model;

      // Position camera to fit the model
      const newBBox = new window.THREE.Box3().setFromObject(model);
      const newSize = newBBox.getSize(new window.THREE.Vector3());
      const newMax = Math.max(newSize.x, newSize.y, newSize.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(newMax / 2 / Math.tan(fov / 2));
      cameraZ *= 2.0; // add some padding
      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, 0);

      setModelLoading(false);

      // OrbitControls
      const OrbitControlsClass =
        window.THREE?.OrbitControls || window.OrbitControls;
      if (!OrbitControlsClass) {
        console.warn("OrbitControls not loaded, continuing without controls");
      } else {
        const controls = new OrbitControlsClass(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.5;
        controls.enableZoom = true;
        controls.enablePan = true;
        // Map touch gestures: one-finger rotate, two-finger pan
        try {
          if (window.THREE && window.THREE.TOUCH) {
            controls.touches = {
              ONE: window.THREE.TOUCH.ROTATE,
              TWO: window.THREE.TOUCH.PAN,
            };
          }
        } catch (e) {
          // ignore if not supported
        }
        controlsRef.current = controls;
      }

      // Animation loop with controls update
      const mainAnimate = () => {
        animationIdRef.current = requestAnimationFrame(mainAnimate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        renderer.render(scene, camera);
      };
      mainAnimate();
    };

    // Try loader.load first; if it errors, attempt fetching ArrayBuffer and parsing manually
    loader.load(glbModelUrl, handleGltfLoad, undefined, async (error) => {
      console.error("GLB loading error:", error);
      try {
        const resp = await fetch(glbModelUrl, { mode: "cors" });
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();
        // Parse manually using loader.parse
        loader.parse(
          arrayBuffer,
          "",
          (gltf) => {
            handleGltfLoad(gltf);
          },
          (parseErr) => {
            console.error("GLTF parse error after manual fetch:", parseErr);
            setModelError("Failed to parse 3D model");
            setModelLoading(false);
          }
        );
      } catch (e) {
        console.error("Manual fetch/parse failed:", e);
        setModelError("Failed to load 3D model (CORS or network error)");
        setModelLoading(false);
      }
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.dispose();
    };
  }, [glbModelUrl]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
      }}
    >
      {/* Camera Feed - Background */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      />

      {/* Three.js Canvas - Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
      />

      {/* Loading indicator */}
      {modelLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#fff",
            }}
          >
            <div className="sphere-loader">
              <div className="sphere"></div>
              <div className="sphere"></div>
              <div className="sphere"></div>
            </div>
            <Typography
              variant="caption"
              sx={{ color: "#fff", marginTop: "8px", display: "block" }}
            >
              Loading 3D Model...
            </Typography>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {modelError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            zIndex: 3,
          }}
        >
          <div style={{ textAlign: "center", color: "#ff6b6b" }}>
            <Typography variant="body2">{modelError}</Typography>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activePreviewFood, setActivePreviewFood] = useState(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(null);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [allItemsDrawerOpen, setAllItemsDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState("all");
  const [themeMode, setThemeMode] = useState("light");
  const [quantity, setQuantity] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);
  const [glbModelUrl, setGlbModelUrl] = useState("/models/Burger.glb"); // GLB model URL for 3D display
  const [showModel, setShowModel] = useState(false); // only show 3D viewer when an item is explicitly clicked

  // Resolve model URL: use modelPath (or modelUrl) directly from the food item
  // If none is provided, fall back to the local Burger.glb
  useEffect(() => {
    let mounted = true;
    const resolveModel = () => {
      const modelPath =
        activePreviewFood?.modelPath || activePreviewFood?.modelUrl;
      if (!modelPath) {
        if (mounted) setGlbModelUrl("/models/Burger.glb");
        return;
      }
      if (mounted) setGlbModelUrl(modelPath);
    };

    resolveModel();
    return () => {
      mounted = false;
    };
  }, [activePreviewFood]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedFoodDetails, setSelectedFoodDetails] = useState(null);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [customization, setCustomization] = useState({
    spiceLevel: 'medium',
    extras: [],
    specialInstructions: '',
  });
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);

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
          // Set to middle copy of the first item (items.length is the middle set)
          setActiveCarouselIndex(items.length);
        }
      } catch (error) {
        console.error("Failed to load foods", error);
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
    if (selectedCategory !== "All") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by veg/non-veg
    if (vegFilter === "veg") {
      filtered = filtered.filter((item) => item.isVeg === true);
    } else if (vegFilter === "non-veg") {
      filtered = filtered.filter((item) => item.isVeg === false);
    }

    setFilteredItems(filtered);
  }, [foodItems, selectedCategory, vegFilter]);

  // Theme palette
  const palette = useMemo(
    () =>
      themeMode === "dark"
        ? {
            background: "#0a0a0a",
            surface: "rgba(255,255,255,0.06)",
            border: "rgba(255,255,255,0.08)",
            textPrimary: "#FFFFFF",
            textSecondary: "rgba(255,255,255,0.7)",
          }
        : {
            background: "#f8f9fb",
            surface: "#FFFFFF",
            border: "#e5e7eb",
            textPrimary: "#1f2937",
            textSecondary: "#6b7280",
          },
    [themeMode]
  );

  // Categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    foodItems.forEach((item) =>
      uniqueCategories.add(item.category || "General")
    );
    return ["All", ...Array.from(uniqueCategories)];
  }, [foodItems]);

  // Displayed food items based on active category filter
  const displayedFoodItems = useMemo(() => {
    if (activeCategory === "All") return foodItems;
    return foodItems.filter((item) => item.category === activeCategory);
  }, [foodItems, activeCategory]);

  // Cart count
  const cartCount = useMemo(() => {
    const saved = localStorage.getItem("cart");
    if (!saved) return 0;
    try {
      const cart = JSON.parse(saved);
      return Object.values(cart).reduce(
        (sum, qty) => sum + Number(qty || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [cartVersion]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const addToCart = useCallback(
    (foodId, amount = 1, customOptions = null) => {
      if (!foodId || amount <= 0) return;
      const saved = localStorage.getItem("cart");
      const cart = saved ? JSON.parse(saved) : {};
      
      // Store customization with cart item
      const customizationData = localStorage.getItem('cartCustomization');
      const cartCustomization = customizationData ? JSON.parse(customizationData) : {};
      
      cart[foodId] = (cart[foodId] || 0) + amount;
      
      // Save customization if provided
      if (customOptions) {
        if (!cartCustomization[foodId]) {
          cartCustomization[foodId] = [];
        }
        cartCustomization[foodId].push(customOptions);
        localStorage.setItem('cartCustomization', JSON.stringify(cartCustomization));
      }
      
      localStorage.setItem("cart", JSON.stringify(cart));
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
    // Reset ingredients dropdown when switching food items
    setIngredientsExpanded(false);
    // Show the 3D model area only when a user explicitly clicks/selects an item
    setShowModel(true);
    // Check if item is already in cart and set quantity accordingly
    const saved = localStorage.getItem("cart");
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

  const handleCustomizeOrder = (food) => {
    setSelectedFoodDetails(food);
    setCustomization({
      spiceLevel: 'medium',
      extras: [],
      specialInstructions: '',
    });
    setCustomizeDialogOpen(true);
  };

  const handleAddCustomizedToCart = () => {
    const foodToAdd = selectedFoodDetails || activePreviewFood;
    if (foodToAdd) {
      addToCart(foodToAdd._id, 1, customization);
      setCustomizeDialogOpen(false);
      // Reset customization after adding
      setCustomization({
        spiceLevel: 'medium',
        extras: [],
        specialInstructions: '',
      });
    }
  };

  // Auto-scroll carousel to center selected item
  useEffect(() => {
    if (activePreviewFood) {
      const carousel = document.getElementById("food-carousel-container");
      // Find the middle occurrence of the selected item
      const middleIndex = filteredItems.findIndex(f => f._id === activePreviewFood._id) + filteredItems.length;
      const selectedItem = document.getElementById(
        `carousel-item-${activePreviewFood._id}-${middleIndex}`
      );
      if (carousel && selectedItem) {
        // Set the active carousel index to the middle occurrence
        setActiveCarouselIndex(middleIndex);
        
        const carouselRect = carousel.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        const scrollLeft =
          itemRect.left -
          carouselRect.left -
          carouselRect.width / 2 +
          itemRect.width / 2 +
          carousel.scrollLeft;
        carousel.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [activePreviewFood, filteredItems]);

  // Auto-select centered item on scroll
  useEffect(() => {
    const carousel = document.getElementById("food-carousel-container");
    if (!carousel) return;

    const handleScroll = () => {
      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenter = carouselRect.left + carouselRect.width / 2;

      let closestItem = null;
      let closestDistance = Infinity;
      let closestIndex = null;

      // Check all tripled items
      const totalItems = filteredItems.length * 3;
      for (let i = 0; i < totalItems; i++) {
        const itemElement = document.getElementById(
          `carousel-item-${filteredItems[i % filteredItems.length]._id}-${i}`
        );
        if (itemElement) {
          const itemRect = itemElement.getBoundingClientRect();
          const itemCenter = itemRect.left + itemRect.width / 2;
          const distance = Math.abs(carouselCenter - itemCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestItem = itemElement;
            closestIndex = i;
          }
        }
      }

      if (closestItem && closestIndex !== null) {
        const foodIndex = closestIndex % filteredItems.length;
        const food = filteredItems[foodIndex];
        if (food && food._id !== activePreviewFood?._id) {
          setActivePreviewFood(food);
          setActiveCarouselIndex(closestIndex);
          const saved = localStorage.getItem("cart");
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
    };

    let scrollTimeout;
    const debouncedScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 20);
    };

    carousel.addEventListener("scroll", debouncedScroll);
    return () => {
      carousel.removeEventListener("scroll", debouncedScroll);
      clearTimeout(scrollTimeout);
    };
  }, [filteredItems, activePreviewFood]);

  // CAMERA LOGIC
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const stopCamera = () => {
    const v = videoRef.current;
    if (v && v.srcObject) {
      try {
        v.srcObject.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      v.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const v = videoRef.current;
      if (!v) return;

      v.srcObject = stream;
      await v.play().catch(() => {});
      setCameraActive(true);
    } catch (err) {
      setCameraError(err?.message || "Camera error");
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div
      style={{
        backgroundColor: palette.background,
        minHeight: "100vh",
        transition: "background-color 0.3s ease",
        overflow: "hidden",
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
            <div style={{ marginTop: "24px" }}>
              <SphereLoader isDark={themeMode === "dark"} />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: palette.background,
          color: palette.textPrimary,
          padding: "16px 20px",
          position: "sticky",
          top: 0,
          zIndex: 120,
          borderBottom: `1px solid ${palette.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div>
            <Typography variant="h6" fontWeight={800}>
              AR Food Menu
            </Typography>
            <Typography variant="caption" sx={{ color: palette.textSecondary }}>
              Explore dishes in 3D
            </Typography>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <IconButton
              onClick={toggleTheme}
              sx={{
                backgroundColor: palette.surface,
                color: palette.textPrimary,
                padding: "8px",
                "&:hover": { backgroundColor: palette.surface, opacity: 0.8 },
              }}
              title="Toggle theme"
            >
              {themeMode === "dark" ? (
                <LightModeIcon fontSize="small" />
              ) : (
                <DarkModeIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              onClick={() => setMenuDrawerOpen(true)}
              sx={{
                backgroundColor: palette.surface,
                color: palette.textPrimary,
                padding: "8px",
                "&:hover": { backgroundColor: palette.surface, opacity: 0.8 },
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
                padding: "8px",
                "&:hover": { backgroundColor: palette.surface, opacity: 0.8 },
              }}
              title="Logout"
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen 3D Viewer */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "calc(100vh - 80px - 130px)",
        }}
      >
        {activePreviewFood && showModel && (
          <>
            {/* 3D GLB Viewer with Camera - Full Screen */}
            <div style={{ width: "100%", height: "100%" }}>
              <CameraWith3D videoRef={videoRef} glbModelUrl={glbModelUrl} />
              {/* Food Info Overlay - Top Left */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxWidth: "220px",
                  zIndex: 120,
                }}
              >
                {/* Name Box */}
                <div
                  style={{
                    background: themeMode === "dark" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    boxShadow: themeMode === "dark" ? "0 4px 16px rgba(0,0,0,0.6)" : "0 2px 8px rgba(0,0,0,0.2)",
                    border: `2px solid ${themeMode === "dark" ? "rgba(102, 126, 234, 0.3)" : "rgba(102, 126, 234, 0.2)"}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      color: palette.textPrimary,
                      fontSize: "0.75rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {activePreviewFood.name}
                  </Typography>
                </div>

                {/* Price Box */}
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))",
                    backdropFilter: "blur(20px)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Price
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                      color: "#fff",
                      fontSize: "1.1rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ₹{activePreviewFood.price}
                  </Typography>
                </div>

                {/* Customization Options Box */}
                
              </div>
            </div>
          </>
        )}

        {/* Loading State */}
        {loadingFoods && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px 0",
              alignItems: "center",
              height: "calc(100vh - 200px)",
            }}
          >
            <SphereLoader isDark={themeMode === "dark"} />
          </div>
        )}
      </div>

      {/* Bottom Footer with Scrolling Carousel */}
      {!loadingFoods && filteredItems.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "130px",
            paddingTop: "12px",
            zIndex: 90,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0 16px",
            gap: "16px",
          }}
        >
          {/* LEFT: Minus Placeholder / Button */}
          <div
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activePreviewFood && quantity > 0 ? (
              <IconButton
                onClick={() => {
                  if (quantity > 1) {
                    const newQty = quantity - 1;
                    setQuantity(newQty);
                    const cart = JSON.parse(
                      localStorage.getItem("cart") || "{}"
                    );
                    cart[activePreviewFood._id] = newQty;
                    localStorage.setItem("cart", JSON.stringify(cart));
                    setCartVersion((prev) => prev + 1);
                  } else if (quantity === 1) {
                    const cart = JSON.parse(
                      localStorage.getItem("cart") || "{}"
                    );
                    delete cart[activePreviewFood._id];
                    localStorage.setItem("cart", JSON.stringify(cart));
                    setQuantity(0);
                    setCartVersion((prev) => prev + 1);
                  }
                }}
                sx={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  width: "32px",
                  height: "32px",
                  "&:hover": {
                    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                    transform: "scale(1.1)",
                  },
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                <RemoveIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            ) : (
              // Placeholder when minus hidden
              <div style={{ width: "32px", height: "32px" }}></div>
            )}
          </div>

          {/* CENTER: Food Scrolling Carousel */}
          <div
            id="food-carousel-container"
            style={{
              overflowX: "auto",
              overflowY: "visible",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              paddingTop: "15px",
              paddingBottom: "15px",
            }}
            className="food-carousel-scroll"
            onScroll={(e) => {
              const container = e.target;
              const scrollLeft = container.scrollLeft;
              const scrollWidth = container.scrollWidth;
              const clientWidth = container.clientWidth;
              
              // Check if scrolled to the end (near right edge)
              if (scrollLeft + clientWidth >= scrollWidth - 10) {
                // Temporarily disable smooth scrolling for the jump
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = scrollLeft - (scrollWidth / 3);
                // Re-enable smooth scrolling
                setTimeout(() => {
                  container.style.scrollBehavior = 'smooth';
                }, 50);
              }
              
              // Check if scrolled to the beginning (near left edge)
              else if (scrollLeft <= 10) {
                // Temporarily disable smooth scrolling for the jump
                container.style.scrollBehavior = 'auto';
                container.scrollLeft = (scrollWidth / 3) + scrollLeft;
                // Re-enable smooth scrolling
                setTimeout(() => {
                  container.style.scrollBehavior = 'smooth';
                }, 50);
              }
            }}
          >
            {/* Render items 3 times for infinite scroll effect */}
            {[...filteredItems, ...filteredItems, ...filteredItems].map((food, index) => {
              const isActive = activeCarouselIndex === index;

              // Get quantity for this food item from cart
              const saved = localStorage.getItem("cart");
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
                  key={`${food._id}-${index}`}
                  id={`carousel-item-${food._id}-${index}`}
                  onClick={() => {
                    handleFoodSelection(food);
                    setActiveCarouselIndex(index);
                  }}
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    minWidth: isActive ? "90px" : "70px",
                    transition: "all 0.3s ease",
                    transform: isActive ? "scale(1.2)" : "scale(1)",
                    opacity: isActive ? 1 : 0.7,
                    position: "relative",
                  }}
                >
                  {/* IMAGE CIRCLE */}
                  <div
                    style={{
                      width: isActive ? "70px" : "56px",
                      height: isActive ? "70px" : "56px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: isActive
                        ? "3px solid transparent"
                        : `2px solid ${palette.border}`,
                      background: isActive
                        ? "linear-gradient(white, white) padding-box, linear-gradient(135deg, #667eea, #764ba2) border-box"
                        : palette.surface,
                      boxShadow: isActive
                        ? "0 8px 24px rgba(102, 126, 234, 0.7), 0 0 0 4px rgba(102, 126, 234, 0.2)"
                        : themeMode === "dark"
                        ? "0 3px 10px rgba(0,0,0,0.5)"
                        : "0 2px 6px rgba(0,0,0,0.15)",
                      position: "relative",
                      transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <img
                      src={
                        food.imageUrl ||
                        "https://via.placeholder.com/80?text=Food"
                      }
                      alt={food.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {/* VEG / NON-VEG MARKER */}
                    <div
                      style={{
                        position: "absolute",
                        top: "3px",
                        right: "3px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "4px",
                        background: "rgba(0,0,0,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${
                          food.isVeg ? "#10b981" : "#ef4444"
                        }`,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: food.isVeg ? "#10b981" : "#ef4444",
                        }}
                      />
                    </div>

                    {/* 3D MODEL BADGE */}
                    {food.modelUrl && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "4px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "rgba(102, 126, 234, 0.95)",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ViewInArIcon
                          sx={{ fontSize: "12px", color: "#fff" }}
                        />
                      </div>
                    )}

                    {/* QUANTITY BADGE */}
                    {itemQuantity > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          background:
                            "linear-gradient(135deg, #10b981, #059669)",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.6)",
                          border: "2px solid white",
                          zIndex: 10,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#fff",
                            fontSize: "0.7rem",
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
                        ? themeMode === "dark"
                          ? "#667eea"
                          : "#764ba2"
                        : palette.textPrimary,
                      fontSize: "0.65rem",
                      maxWidth: "100%",
                      textAlign: "center",
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
                const cart = JSON.parse(localStorage.getItem("cart") || "{}");
                cart[activePreviewFood._id] = newQty;
                localStorage.setItem("cart", JSON.stringify(cart));
                setCartVersion((prev) => prev + 1);
              }}
              sx={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                width: "32px",
                height: "32px",
                minWidth: "32px",
                flexShrink: 0,
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #047857)",
                  transform: "scale(1.1)",
                },
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                transition: "all 0.3s ease",
              }}
            >
              <AddIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          )}
        </div>
      )}

      {/* Floating Cart & Theme Button - Top Right */}
      {!loadingFoods && (
        <div
          style={{
            position: "fixed",
            top: "100px",
            right: "20px",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Order Camera Button */}
          <Fab
            size="small"
            onClick={() => {
              cameraActive ? stopCamera() : startCamera();
            }}
            sx={{
              background: cameraActive
                ? "linear-gradient(135deg, #ff5252, #ff1744)" // RED when camera ON
                : "linear-gradient(135deg, #f093fb, #f5576c)", // Pink when camera OFF
              color: "#fff",
              width: "48px",
              height: "48px",
              boxShadow: "0 4px 16px rgba(240, 147, 251, 0.5)",
              "&:hover": {
                transform: "scale(1.08)",
                boxShadow: "0 8px 20px rgba(240, 147, 251, 0.7)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <CameraIcon sx={{ fontSize: 20 }} />
          </Fab>

          {cameraError && (
            <div style={{ color: "red", textAlign: "center", marginTop: 10 }}>
              {cameraError}
            </div>
          )}
          {/* View Cart Button */}
          <Fab
            size="small"
            onClick={() => navigate("/customer/cart")}
            sx={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "#fff",
              width: "48px",
              height: "48px",
              boxShadow: "0 4px 16px rgba(102, 126, 234, 0.5)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2, #667eea)",
                transform: "scale(1.08)",
                boxShadow: "0 8px 20px rgba(102, 126, 234, 0.7)",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            title="View Cart"
          >
            <Badge
              badgeContent={cartCount}
              color="error"
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: "0.7rem",
                  height: "18px",
                  minWidth: "18px",
                  borderRadius: "9px",
                  fontWeight: 700,
                  top: 2,
                  right: 2,
                },
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: "24px" }} />
            </Badge>
          </Fab>

          {/* All Items Menu Button */}
          <Fab
            size="small"
            onClick={() => setAllItemsDrawerOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              width: "48px",
              height: "48px",
              boxShadow: "0 4px 16px rgba(245, 158, 11, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #d97706, #b45309)",
                transform: "scale(1.08)",
              },
              transition: "all 0.3s ease",
            }}
            title="View All Items"
          >
            <RestaurantMenuIcon sx={{ fontSize: "24px" }} />
          </Fab>

          {/* Filter Button */}
          <Fab
            size="small"
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "#fff",
              width: "48px",
              height: "48px",
              boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #6d28d9, #5b21b6)",
                transform: "scale(1.08)",
              },
              transition: "all 0.3s ease",
            }}
            title="Filter by Category"
          >
            <FilterListIcon sx={{ fontSize: "24px" }} />
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
            width: { xs: "90vw", sm: 420 },
            backgroundColor: themeMode === "dark" ? "#0f0f0f" : "#ffffff",
            color: palette.textPrimary,
          },
        }}
      >
        <div
          style={{
            padding: "24px 20px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div>
              <Typography variant="h6" fontWeight={700}>
                Menu Card
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: palette.textSecondary }}
              >
                {foodItems.length} curated dishes
              </Typography>
            </div>
            <IconButton
              onClick={() => setMenuDrawerOpen(false)}
              sx={{ color: palette.textPrimary }}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <List sx={{ overflowY: "auto", flex: 1 }}>
            {foodItems.map((food, index) => {
              // Get quantity for this food item from cart
              const saved = localStorage.getItem("cart");
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
                  <ListItem
                    alignItems="flex-start"
                    sx={{ gap: 1, paddingY: 1.5 }}
                  >
                    <ListItemAvatar sx={{ position: "relative" }}>
                      <Avatar
                        variant="rounded"
                        src={
                          food.imageUrl ||
                          "https://via.placeholder.com/80?text=Food"
                        }
                        alt={food.name}
                        sx={{ width: 56, height: 56, borderRadius: "12px" }}
                      />
                      {itemQuantity > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background:
                              "linear-gradient(135deg, #10b981, #059669)",
                            borderRadius: "50%",
                            width: "22px",
                            height: "22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.6)",
                            border: "2px solid white",
                            zIndex: 10,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#fff",
                              fontSize: "0.7rem",
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
                        <Typography
                          variant="body2"
                          sx={{ color: palette.textSecondary }}
                        >
                          ₹{food.price} · {food.category}
                        </Typography>
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                          handleFoodSelection(food);
                          setMenuDrawerOpen(false);
                        }}
                        sx={{
                          background:
                            "linear-gradient(135deg, #667eea, #764ba2)",
                          color: "#fff",
                        }}
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
                          "&:hover": { borderColor: "#667eea" },
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </ListItem>
                  {index < foodItems.length - 1 && (
                    <Divider sx={{ borderColor: palette.border }} />
                  )}
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
            height: "90vh",
            borderTopLeftRadius: "24px",
            borderTopRightRadius: "24px",
            background: palette.surface,
          },
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "24px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: palette.textPrimary }}
              >
                All Menu Items
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: palette.textSecondary, marginTop: "4px" }}
              >
                {foodItems.length} items available
              </Typography>
            </div>
            <IconButton
              onClick={() => setAllItemsDrawerOpen(false)}
              sx={{ color: palette.textPrimary }}
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Category Filter Chips */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <Chip
              label="All"
              onClick={() => setActiveCategory("All")}
              sx={{
                backgroundColor:
                  activeCategory === "All" ? "#667eea" : palette.surface,
                color: activeCategory === "All" ? "#fff" : palette.textPrimary,
                border: `1px solid ${
                  activeCategory === "All" ? "#667eea" : palette.border
                }`,
                fontWeight: 600,
                fontSize: "0.85rem",
                "&:hover": {
                  backgroundColor:
                    activeCategory === "All" ? "#764ba2" : palette.background,
                },
              }}
            />
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setActiveCategory(cat)}
                sx={{
                  backgroundColor:
                    activeCategory === cat ? "#667eea" : palette.surface,
                  color: activeCategory === cat ? "#fff" : palette.textPrimary,
                  border: `1px solid ${
                    activeCategory === cat ? "#667eea" : palette.border
                  }`,
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  "&:hover": {
                    backgroundColor:
                      activeCategory === cat ? "#764ba2" : palette.background,
                  },
                }}
              />
            ))}
          </div>

          {/* Food Items Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "16px",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {displayedFoodItems.map((food) => {
              // Get quantity for this food item from cart
              const saved = localStorage.getItem("cart");
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
                  {food.description && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: palette.textSecondary, 
                        display: 'block', 
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {food.description}
                    </Typography>
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ color: palette.textSecondary, display: 'block', marginBottom: '4px' }}
                  >
                    {food.category}
                  </Typography>
                  {/* Calories Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <LocalFireDepartmentIcon sx={{ fontSize: '14px', color: '#f59e0b' }} />
                    <Typography 
                      variant="caption" 
                      sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.7rem' }}
                    >
                      {food.calories || 0} kcal
                    </Typography>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                  {/* Details Button */}
                  <Button
                    size="small"
                    fullWidth
                    startIcon={<InfoIcon sx={{ fontSize: '14px' }} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFoodDetails(food);
                      setDetailsDialogOpen(true);
                    }}
                    sx={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      color: palette.textPrimary,
                      borderColor: palette.border,
                      '&:hover': {
                        backgroundColor: palette.background,
                        borderColor: '#667eea',
                      },
                    }}
                    variant="outlined"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </Drawer>

      {/* Food Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: palette.surface,
            borderRadius: '16px',
          },
        }}
      >
        {selectedFoodDetails && (
          <>
            <DialogTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ color: palette.textPrimary }}>
                    {selectedFoodDetails.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                    {selectedFoodDetails.category}
                  </Typography>
                </div>
                <IconButton onClick={() => setDetailsDialogOpen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </div>
            </DialogTitle>
            <DialogContent dividers>
              {/* Food Image */}
              {selectedFoodDetails.imageUrl && (
                <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={selectedFoodDetails.imageUrl}
                    alt={selectedFoodDetails.name}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Price */}
              <Typography 
                variant="h5" 
                fontWeight={800} 
                sx={{ 
                  color: '#667eea',
                  marginBottom: '16px',
                }}
              >
                ₹{selectedFoodDetails.price}
              </Typography>

              {/* Description */}
              {selectedFoodDetails.description && (
                <div style={{ marginBottom: '16px' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary, marginBottom: '8px' }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: palette.textSecondary, lineHeight: 1.6 }}>
                    {selectedFoodDetails.description}
                  </Typography>
                </div>
              )}

              {/* Ingredients Accordion */}
              {selectedFoodDetails.ingredients && selectedFoodDetails.ingredients.length > 0 && (
                <Accordion 
                  sx={{ 
                    marginBottom: '12px',
                    background: palette.background,
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: palette.textPrimary }} />}
                    sx={{ 
                      '& .MuiAccordionSummary-content': { 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1 
                      } 
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: '20px', color: '#667eea' }} />
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary }}>
                      Ingredients ({selectedFoodDetails.ingredients.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedFoodDetails.ingredients.map((ingredient, index) => (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: palette.surface,
                            borderRadius: '8px',
                            border: `1px solid ${palette.border}`,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: palette.textPrimary }}>
                            {ingredient.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: palette.textSecondary, fontWeight: 600 }}>
                            {ingredient.quantity}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Calories Accordion */}
              <Accordion 
                sx={{ 
                  background: palette.background,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: palette.textPrimary }} />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': { 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1 
                    } 
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ fontSize: '20px', color: '#f59e0b' }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary }}>
                    Nutritional Information
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div 
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
                      borderRadius: '12px',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography 
                      variant="h3" 
                      fontWeight={800} 
                      sx={{ 
                        color: '#f59e0b',
                        marginBottom: '4px',
                      }}
                    >
                      {selectedFoodDetails.calories || 0}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                      Calories (kcal)
                    </Typography>
                  </div>
                </AccordionDetails>
              </Accordion>

              {/* Veg/Non-Veg Badge */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Chip
                  label={selectedFoodDetails.isVeg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
                  size="small"
                  sx={{
                    backgroundColor: selectedFoodDetails.isVeg ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedFoodDetails.isVeg ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                    border: `1px solid ${selectedFoodDetails.isVeg ? '#10b981' : '#ef4444'}`,
                  }}
                />
                {selectedFoodDetails.modelUrl && (
                  <Chip
                    label="3D Model Available"
                    size="small"
                    icon={<ViewInArIcon sx={{ fontSize: '16px' }} />}
                    sx={{
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      fontWeight: 600,
                      border: '1px solid #667eea',
                    }}
                  />
                )}
              </div>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px', display: 'flex', gap: 1 }}>
              <Button
                onClick={() => setDetailsDialogOpen(false)}
                sx={{ color: palette.textPrimary }}

              >
                Close
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  handleCustomizeOrder(selectedFoodDetails);
                  setDetailsDialogOpen(false);
                }}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5568d3',
                    background: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Customize & Add
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  addToCart(selectedFoodDetails._id);
                  setDetailsDialogOpen(false);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                  },
                }}
                startIcon={<AddIcon />}
              >
                Add to Cart
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Customization Dialog */}
      <Dialog
        open={customizeDialogOpen}
        onClose={() => setCustomizeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: palette.background,
            borderRadius: '16px',
          }
        }}
      >
        {selectedFoodDetails && (
          <>
            <DialogTitle sx={{ 
              paddingBottom: '8px',
              borderBottom: `1px solid ${palette.border}`,
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: palette.textPrimary }}>
                Customize Your Order
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary, marginTop: '4px' }}>
                {selectedFoodDetails.name}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ paddingTop: '16px' }}>
              {/* Spice Level */}
              <div style={{ marginBottom: '24px' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary, marginBottom: '12px' }}>
                  🌶️ Spice Level
                </Typography>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['mild', 'medium', 'spicy', 'extra-spicy'].map((level) => (
                    <Button
                      key={level}
                      variant={customization.spiceLevel === level ? 'contained' : 'outlined'}
                      onClick={() => setCustomization({ ...customization, spiceLevel: level })}
                      size="small"
                      sx={{
                        textTransform: 'capitalize',
                        borderColor: customization.spiceLevel === level ? '#667eea' : palette.border,
                        background: customization.spiceLevel === level ? '#667eea' : 'transparent',
                        color: customization.spiceLevel === level ? '#fff' : palette.textPrimary,
                        '&:hover': {
                          borderColor: '#667eea',
                          background: customization.spiceLevel === level ? '#5568d3' : 'rgba(102, 126, 234, 0.1)',
                        },
                      }}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Extra Items */}
              <div style={{ marginBottom: '24px' }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary, marginBottom: '12px' }}>
                  ➕ Extra Items
                </Typography>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'extra-salt', label: 'Extra Salt', icon: '🧂' },
                    { id: 'extra-cheese', label: 'Extra Cheese', icon: '🧀' },
                    { id: 'extra-sauce', label: 'Extra Sauce', icon: '🥫' },
                    { id: 'extra-vegetables', label: 'Extra Vegetables', icon: '🥗' },
                    { id: 'extra-meat', label: 'Extra Meat', icon: '🍖' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        const isSelected = customization.extras.includes(item.id);
                        setCustomization({
                          ...customization,
                          extras: isSelected
                            ? customization.extras.filter(e => e !== item.id)
                            : [...customization.extras, item.id],
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: customization.extras.includes(item.id) 
                          ? 'rgba(102, 126, 234, 0.1)' 
                          : palette.surface,
                        border: `2px solid ${customization.extras.includes(item.id) ? '#667eea' : palette.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: palette.textPrimary,
                          fontWeight: customization.extras.includes(item.id) ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </Typography>
                      {customization.extras.includes(item.id) && (
                        <span style={{ marginLeft: 'auto', color: '#667eea', fontSize: '18px' }}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: palette.textPrimary, marginBottom: '12px' }}>
                  📝 Special Instructions
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Any special requests? (e.g., less oil, no onions, etc.)"
                  value={customization.specialInstructions}
                  onChange={(e) => setCustomization({ ...customization, specialInstructions: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: palette.surface,
                      '& fieldset': {
                        borderColor: palette.border,
                      },
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: palette.textPrimary,
                    },
                  }}
                />
              </div>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px', display: 'flex', gap: 1 }}>
              <Button
                onClick={() => setCustomizeDialogOpen(false)}
                sx={{ color: palette.textPrimary }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddCustomizedToCart}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                  },
                }}
                startIcon={<AddIcon />}
              >
                Add to Cart
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: "280px",
            background: palette.surface,
            padding: "24px",
          },
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: palette.textPrimary }}
            >
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ color: palette.textPrimary }}
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Veg/Non-Veg Filter */}
          <div style={{ marginBottom: "24px" }}>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{
                color: palette.textSecondary,
                display: "block",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Food Type
            </Typography>
            <div style={{ display: "flex", gap: "8px" }}>
              <Chip
                label="All"
                onClick={() => setVegFilter("all")}
                sx={{
                  flex: 1,
                  backgroundColor:
                    vegFilter === "all" ? "#667eea" : palette.surface,
                  color: vegFilter === "all" ? "#fff" : palette.textPrimary,
                  border: `1px solid ${
                    vegFilter === "all" ? "#667eea" : palette.border
                  }`,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor:
                      vegFilter === "all" ? "#764ba2" : palette.background,
                  },
                }}
              />
              <Chip
                label="🟢 Veg"
                onClick={() => setVegFilter("veg")}
                sx={{
                  flex: 1,
                  backgroundColor:
                    vegFilter === "veg" ? "#10b981" : palette.surface,
                  color: vegFilter === "veg" ? "#fff" : palette.textPrimary,
                  border: `1px solid ${
                    vegFilter === "veg" ? "#10b981" : palette.border
                  }`,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor:
                      vegFilter === "veg" ? "#059669" : palette.background,
                  },
                }}
              />
              <Chip
                label="🔴 Non-Veg"
                onClick={() => setVegFilter("non-veg")}
                sx={{
                  flex: 1,
                  backgroundColor:
                    vegFilter === "non-veg" ? "#ef4444" : palette.surface,
                  color: vegFilter === "non-veg" ? "#fff" : palette.textPrimary,
                  border: `1px solid ${
                    vegFilter === "non-veg" ? "#ef4444" : palette.border
                  }`,
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor:
                      vegFilter === "non-veg" ? "#dc2626" : palette.background,
                  },
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: palette.textSecondary,
              display: "block",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Category
          </Typography>
          {/* Category List */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <Button
              fullWidth
              variant={selectedCategory === "All" ? "contained" : "outlined"}
              onClick={() => {
                setSelectedCategory("All");
                setFilterDrawerOpen(false);
              }}
              sx={{
                justifyContent: "flex-start",
                padding: "12px 16px",
                background:
                  selectedCategory === "All"
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : "transparent",
                color:
                  selectedCategory === "All" ? "#fff" : palette.textPrimary,
                borderColor: palette.border,
                "&:hover": {
                  background:
                    selectedCategory === "All"
                      ? "linear-gradient(135deg, #764ba2, #667eea)"
                      : palette.background,
                },
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: selectedCategory === "All" ? 700 : 500,
              }}
            >
              All Items
            </Button>
            {categories
              .filter((cat) => cat !== "All")
              .map((category) => (
                <Button
                  key={category}
                  fullWidth
                  variant={
                    selectedCategory === category ? "contained" : "outlined"
                  }
                  onClick={() => {
                    setSelectedCategory(category);
                    setFilterDrawerOpen(false);
                  }}
                  sx={{
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    background:
                      selectedCategory === category
                        ? "linear-gradient(135deg, #667eea, #764ba2)"
                        : "transparent",
                    color:
                      selectedCategory === category
                        ? "#fff"
                        : palette.textPrimary,
                    borderColor: palette.border,
                    "&:hover": {
                      background:
                        selectedCategory === category
                          ? "linear-gradient(135deg, #764ba2, #667eea)"
                          : palette.background,
                    },
                    textTransform: "none",
                    fontSize: "0.95rem",
                    fontWeight: selectedCategory === category ? 700 : 500,
                  }}
                >
                  {category}
                </Button>
              ))}
          </div>

          {/* Active Filter Info */}
          {(selectedCategory !== "All" || vegFilter !== "all") && (
            <div
              style={{
                marginTop: "auto",
                padding: "16px",
                background:
                  themeMode === "dark"
                    ? "rgba(102, 126, 234, 0.15)"
                    : "rgba(102, 126, 234, 0.1)",
                borderRadius: "12px",
                border: `1px solid ${
                  themeMode === "dark"
                    ? "rgba(102, 126, 234, 0.3)"
                    : "rgba(102, 126, 234, 0.2)"
                }`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: palette.textSecondary,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Active Filters:
              </Typography>
              {vegFilter !== "all" && (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: palette.textPrimary }}
                >
                  {vegFilter === "veg" ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
                </Typography>
              )}
              {selectedCategory !== "All" && (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: palette.textPrimary }}
                >
                  {selectedCategory}
                </Typography>
              )}
              <Typography
                variant="caption"
                sx={{
                  color: palette.textSecondary,
                  marginTop: "8px",
                  display: "block",
                }}
              >
                {filteredItems.length} item
                {filteredItems.length !== 1 ? "s" : ""} found
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
