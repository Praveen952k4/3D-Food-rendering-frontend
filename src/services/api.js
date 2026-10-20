import axios from 'axios';

// Force localhost for development - don't use network IP
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Request with auth token to:', config.url);
    } else {
      console.warn('⚠️ No auth token found for request to:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response error from:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    return Promise.reject(error);
  }
);

// Auth APIs
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const updateProfile = (phone, name, email) => 
  api.post('/auth/update-profile', { phone, name, email });
// Role-scoped sign-in: guests by table, staff by staff ID + password.
export const guestLogin = (tableNumber, name) =>
  api.post('/auth/guest/login', { tableNumber, name });
export const staffLogin = (staffId, password) =>
  api.post('/auth/staff/login', { staffId, password });
export const getTables = () => api.get('/auth/tables');
// Reserve one of the free tables, held in the guest's name, for right now.
export const bookTable = (tableNumber, name) =>
  api.post('/auth/guest/book', { tableNumber, name });

// --- advance bookings ------------------------------------------------------
export const getTableAvailability = (scheduledFor, partySize) =>
  api.get('/bookings/availability', { params: { scheduledFor, partySize } });
export const createBooking = (booking) => api.post('/bookings', booking);
export const getMyBookings = () => api.get('/bookings/mine');
export const savePreOrder = (id, preOrderItems) =>
  api.put(`/bookings/${id}/pre-order`, { preOrderItems });
export const checkInBooking = (id) => api.post(`/bookings/${id}/check-in`);
export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`);
export const getBookings = (days = 7) => api.get('/bookings', { params: { days } });
export const setBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });

// --- tables on the floor ---------------------------------------------------
export const getFloorTables = () => api.get('/tables');
export const getMyTable = () => api.get('/tables/mine');
export const leaveTable = () => api.post('/tables/leave');
export const freeTable = (number) => api.post(`/tables/${number}/free`);

// Food APIs
export const getFoodItems = (category, isVeg) => 
  api.get('/food', { params: { category, isVeg } });
export const getFoodItem = (id) => api.get(`/food/${id}`);
export const toggleFoodLike = (id) => api.post(`/food/${id}/like`);
export const rateFoodItem = (id, rating, review) => 
  api.post(`/food/${id}/rate`, { rating, review });

// Order APIs
export const getOrders = () => api.get('/orders');
export const createOrder = (orderData) => api.post('/orders', orderData);
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const getOrderHistory = (phone) => api.get(`/orders/history/${phone}`);
export const getActiveOrders = () => api.get('/orders/active/notifications');
export const submitFeedback = (orderId, rating, feedback) => 
  api.post(`/orders/${orderId}/feedback`, { rating, feedback });

// Feedback APIs
export const submitDetailedFeedback = (feedbackData) => api.post('/feedback/submit', feedbackData);
export const getFeedbackByOrder = (orderId) => api.get(`/feedback/order/${orderId}`);
export const getAllFeedback = () => api.get('/feedback/all');
export const getFeedbackStats = () => api.get('/feedback/stats');

// Item Feedback APIs (per-food ratings)
export const submitItemFeedback = (feedbackData) => api.post('/item-feedback/submit', feedbackData);
export const getItemsWithRatings = () => api.get('/item-feedback/items-with-ratings');
export const getItemRatings = (foodId) => api.get(`/item-feedback/item/${foodId}`);

// Admin APIs
export const getAdminOrders = (status, date) => 
  api.get('/admin/orders', { params: { status, date } });
export const updateAdminOrder = (id, data) => api.put(`/admin/orders/${id}`, data);
export const updateAdminOrderFeedback = (id, shopFeedback) =>
  api.put(`/admin/orders/${id}/feedback`, { shopFeedback });
export const sendOrderReceipt = (id, send = true) =>
  api.put(`/admin/orders/${id}/send-receipt`, { send });
export const getFeedbackSummary = () => api.get('/admin/feedback-summary');
export const getCustomers = () => api.get('/admin/customers');
export const getOnlineUsers = () => api.get('/admin/users/online');
export const getLoginHistory = () => api.get('/admin/users/login-history');
// The service timeline: table taken → ordered → taken by staff → cooked → served.
export const getActivity = (hours = 24, limit = 60) =>
  api.get('/admin/activity', { params: { hours, limit } });
export const createFoodItem = (data) => api.post('/admin/food', data);
export const updateFoodItem = (id, data) => api.put(`/admin/food/${id}`, data);
export const deleteFoodItem = (id) => api.delete(`/admin/food/${id}`);
export const getAdminFoodItems = () => api.get('/admin/food');

// Analytics APIs
export const getDashboard = () => api.get('/analytics/dashboard');
export const getDailyReport = (date) => api.get('/analytics/daily-report', { params: { date } });
export const getMonthlyReport = (year, month) => 
  api.get('/analytics/monthly-report', { params: { year, month } });
export const getOverview = (range) => api.get('/analytics/overview', { params: { range } });
export const getGstSummary = (params) => api.get('/analytics/gst-summary', { params });

// Coupon APIs
export const getAvailableCoupons = () => api.get('/coupons/available');
export const validateCoupon = (code, orderValue) => 
  api.get(`/coupons/validate/${code}`, { params: { orderValue } });
export const applyCoupon = (code, orderValue) => 
  api.post('/coupons/apply', { code, orderValue });
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);
export const toggleCoupon = (id) => api.patch(`/coupons/${id}/toggle`);

// Chef APIs
export const getChefOrders = () => api.get('/chef/orders');
export const markOrderDelivered = (orderId) => api.put(`/chef/orders/${orderId}/deliver`);
export const updateChefOrderStatus = (orderId, status) => 
  api.patch(`/chef/orders/${orderId}/status`, { status });

export default api;
