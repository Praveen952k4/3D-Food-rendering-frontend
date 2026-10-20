import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import Landing from '../../pages/Landing';
import LoginChooser from '../../pages/auth/LoginChooser';
import GuestLogin from '../../pages/auth/GuestLogin';
import BookingLogin from '../../pages/auth/BookingLogin';
import CustomerLogin from '../../pages/auth/CustomerLogin';
import ChefLogin from '../../pages/auth/ChefLogin';
import AdminDashboard from '../../pages/Admin/Dashboard';
import OrderManagement from '../../pages/Admin/OrderManagement';
import GstReport from '../../pages/Admin/GstReport';
import AdminFoodManagement from '../../pages/Admin/FoodManagement';
import CouponManagement from '../../pages/Admin/CouponManagement';
import UserManagement from '../../pages/Admin/UserManagement';
import AdminBookings from '../../pages/Admin/Bookings';
import FoodRatings from '../../pages/Admin/FoodRatings';
import ChefDashboard from '../../pages/Chef/Dashboard';
import CustomerHome from '../../pages/Customer/Home';
import CustomerMenu from '../../pages/Customer/Menu';
import CustomerCart from '../../pages/Customer/Cart';
import OrderHistory from '../../pages/Customer/OrderHistory';
import CustomerBookTable from '../../pages/Customer/BookTable';
import MyBookings from '../../pages/Customer/MyBookings';
import AdminLayout from '../AdminLayout';
import ChefLayout from '../../pages/Chef/ChefLayout';
import CustomerLayout from '../CustomerLayout';

/** Guests order alongside customers; admins may look in. */
const DINERS = ['guest', 'customer', 'admin'];

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  // An already-signed-in person has no business on a sign-in page.
  const signedInRedirect = (element) =>
    isAuthenticated ? <Navigate to={defaultRouteFor(role)} replace /> : element;

  return (
    <Routes>
      {/* Three doors, each with its own credential */}
      <Route path="/login" element={signedInRedirect(<LoginChooser />)} />
      <Route path="/login/guest" element={signedInRedirect(<GuestLogin />)} />
      <Route path="/login/book" element={signedInRedirect(<BookingLogin />)} />
      <Route path="/login/customer" element={signedInRedirect(<CustomerLogin />)} />
      <Route path="/login/chef" element={signedInRedirect(<ChefLogin />)} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allow={['admin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="gst" element={<GstReport />} />
        <Route path="food" element={<AdminFoodManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        <Route path="food-ratings" element={<FoodRatings />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Kitchen */}
      <Route
        path="/chef"
        element={
          <PrivateRoute allow={['chef', 'admin']}>
            <ChefLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<ChefDashboard />} />
        <Route index element={<Navigate to="/chef/dashboard" replace />} />
      </Route>

      {/* Diners — guests and customers alike */}
      <Route
        path="/customer"
        element={
          <PrivateRoute allow={DINERS}>
            <CustomerLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<CustomerHome />} />
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="orders" element={<OrderHistory />} />
        {/* Booking ahead belongs to an account, so a guest signed in by table
            number is sent to the booking door to sign in properly. */}
        <Route
          path="book"
          element={
            <PrivateRoute allow={['customer', 'admin']} redirectTo="/login/book">
              <CustomerBookTable />
            </PrivateRoute>
          }
        />
        <Route
          path="bookings"
          element={
            <PrivateRoute allow={['customer', 'admin']} redirectTo="/login/book">
              <MyBookings />
            </PrivateRoute>
          }
        />
        <Route index element={<Navigate to="/customer/home" replace />} />
      </Route>

      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
