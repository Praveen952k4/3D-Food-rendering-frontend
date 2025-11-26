import axios from 'axios';

// Force localhost for development - don't use network IP
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const sendOTP = (phone: string) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp });
export const updateProfile = (phone: string, name: string, email: string) => 
  api.post('/auth/update-profile', { phone, name, email });

// Food APIs
export const getFoodItems = (category?: string, isVeg?: boolean) => 
  api.get('/food', { params: { category, isVeg } });
export const getFoodItem = (id: string) => api.get(`/food/${id}`);
export const toggleFoodLike = (id: string) => api.post(`/food/${id}/like`);
export const rateFoodItem = (id: string, rating: number, review?: string) => 
  api.post(`/food/${id}/rate`, { rating, review });

// Order APIs
export const getOrders = () => api.get('/orders');
export const createOrder = (orderData: any) => api.post('/orders', orderData);
export const getOrder = (id: string) => api.get(`/orders/${id}`);
export const updateOrder = (id: string, data: any) => api.put(`/orders/${id}`, data);
export const getOrderHistory = (phone: string) => api.get(`/orders/history/${phone}`);
export const submitFeedback = (orderId: string, rating: number, feedback: string) => 
  api.post(`/orders/${orderId}/feedback`, { rating, feedback });

// Admin APIs
export const getAdminOrders = (status?: string, date?: string) => 
  api.get('/admin/orders', { params: { status, date } });
export const updateAdminOrder = (id: string, data: any) => api.put(`/admin/orders/${id}`, data);
export const updateAdminOrderFeedback = (id: string, shopFeedback: string) =>
  api.put(`/admin/orders/${id}/feedback`, { shopFeedback });
export const getFeedbackSummary = () => api.get('/admin/feedback-summary');
export const getCustomers = () => api.get('/admin/customers');
export const getOnlineUsers = () => api.get('/admin/users/online');
export const getLoginHistory = () => api.get('/admin/users/login-history');
export const createFoodItem = (data: any) => api.post('/admin/food', data);
export const updateFoodItem = (id: string, data: any) => api.put(`/admin/food/${id}`, data);
export const deleteFoodItem = (id: string) => api.delete(`/admin/food/${id}`);
export const getAdminFoodItems = () => api.get('/admin/food');

// Analytics APIs
export const getDashboard = () => api.get('/analytics/dashboard');
export const getDailyReport = (date?: string) => api.get('/analytics/daily-report', { params: { date } });
export const getMonthlyReport = (year?: number, month?: number) => 
  api.get('/analytics/monthly-report', { params: { year, month } });

// Coupon APIs
export const validateCoupon = (code: string, orderValue: number) => 
  api.get(`/coupons/validate/${code}`, { params: { orderValue } });
export const applyCoupon = (code: string, orderValue: number) => 
  api.post('/coupons/apply', { code, orderValue });
export const getCoupons = () => api.get('/coupons');
export const createCoupon = (data: any) => api.post('/coupons', data);
export const updateCoupon = (id: string, data: any) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id: string) => api.delete(`/coupons/${id}`);
export const toggleCoupon = (id: string) => api.patch(`/coupons/${id}/toggle`);

export default api;
