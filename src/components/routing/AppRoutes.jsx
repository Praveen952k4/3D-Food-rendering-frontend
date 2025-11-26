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
import CustomerHome from '../../pages/Customer/Home';
import CustomerMenu from '../../pages/Customer/Menu';
import CustomerCart from '../../pages/Customer/Cart';
import OrderHistory from '../../pages/Customer/OrderHistory';
import AdminLayout from '../AdminLayout';
import CustomerLayout from '../CustomerLayout';

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/customer/home'} />
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
        <Route path="users" element={<UserManagement />} />
        <Route index element={<Navigate to="/admin/dashboard" />} />
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
        element={
          <Navigate to={isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/customer/home') : '/login'} />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
