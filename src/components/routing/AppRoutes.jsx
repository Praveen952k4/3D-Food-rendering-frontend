import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import Login from '../../pages/Login';
import AdminDashboard from '../../pages/Admin/Dashboard';
import OrderManagement from '../../pages/Admin/OrderManagement';
import AdminFoodManagement from '../../pages/Admin/FoodManagement';
import CouponManagement from '../../pages/Admin/CouponManagement';
import UserManagement from '../../pages/Admin/UserManagement';
import FeedbackManagement from '../../pages/Admin/FeedbackManagement';
import FoodRatings from '../../pages/Admin/FoodRatings';
import ChefDashboard from '../../pages/Chef/Dashboard';
import CustomerHome from '../../pages/Customer/Home';
import CustomerMenu from '../../pages/Customer/Menu';
import CustomerCart from '../../pages/Customer/Cart';
import OrderHistory from '../../pages/Customer/OrderHistory';
import AdminLayout from '../AdminLayout';
import ChefLayout from '../../pages/Chef/ChefLayout';
import CustomerLayout from '../CustomerLayout';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const isChef = user?.role === 'chef';

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    if (isAdmin) return '/admin/dashboard';
    if (isChef) return '/chef/dashboard';
    return '/customer/home';
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute()} />
          ) : (
            <Login />
          )
        } 
      />

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute adminOnly>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="food" element={<AdminFoodManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        {/* <Route path="feedback" element={<FeedbackManagement />} /> */}
        <Route path="food-ratings" element={<FoodRatings />} />
        <Route path="users" element={<UserManagement />} />
        <Route index element={<Navigate to="/admin/dashboard" />} />
      </Route>

      {/* Chef Routes */}
      <Route 
        path="/chef" 
        element={
          <PrivateRoute chefOnly>
            <ChefLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<ChefDashboard />} />
        <Route index element={<Navigate to="/chef/dashboard" />} />
      </Route>

      {/* Customer Routes */}
      <Route 
        path="/customer" 
        element={
          <PrivateRoute>
            <CustomerLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<CustomerHome />} />
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route index element={<Navigate to="/customer/home" />} />
      </Route>

      <Route 
        path="/" 
        element={<Navigate to={getDefaultRoute()} />} 
      />
    </Routes>
  );
};

export default AppRoutes;
