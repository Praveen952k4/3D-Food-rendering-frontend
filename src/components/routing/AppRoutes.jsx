import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import SignIn from '../../pages/auth/SignIn';
import Landing from '../../pages/Landing';
import AdminDashboard from '../../pages/Admin/Dashboard';
import OrderManagement from '../../pages/Admin/OrderManagement';
import GSTCompliancePortal from '../../pages/Admin/GST/GSTCompliancePortal';
import AdminFoodManagement from '../../pages/Admin/FoodManagement';
import CouponManagement from '../../pages/Admin/CouponManagement';
import UserManagement from '../../pages/Admin/UserManagement';
import AdminTables from '../../pages/Admin/Tables';
import FoodRatings from '../../pages/Admin/FoodRatings';
import ChefDashboard from '../../pages/Chef/Dashboard';
import CustomerHome from '../../pages/Customer/Home';
import CustomerMenu from '../../pages/Customer/Menu';
import CustomerCart from '../../pages/Customer/Cart';
import OrderHistory from '../../pages/Customer/OrderHistory';
import PickTable from '../../pages/Customer/PickTable';
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
      {/* One door. The phone number decides the role, so there is nothing
          for anyone to pick; the old doors still resolve, for links and
          bookmarks that are already out there. */}
      <Route path="/login" element={signedInRedirect(<SignIn />)} />
      <Route path="/login/guest" element={<Navigate to="/login" replace />} />
      <Route path="/login/customer" element={<Navigate to="/login" replace />} />
      <Route path="/login/chef" element={<Navigate to="/login" replace />} />

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
        <Route path="tables" element={<AdminTables />} />
        <Route path="gst" element={<GSTCompliancePortal />} />
        <Route path="gst/*" element={<GSTCompliancePortal />} />
        <Route path="food" element={<AdminFoodManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        <Route path="food-ratings" element={<FoodRatings />} />
        <Route path="users" element={<UserManagement />} />
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
        <Route path="table" element={<PickTable />} />
        <Route path="home" element={<CustomerHome />} />
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route index element={<Navigate to="/customer/home" replace />} />
      </Route>

      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
