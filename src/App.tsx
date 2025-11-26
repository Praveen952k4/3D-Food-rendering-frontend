import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import OrderManagement from './pages/Admin/OrderManagement';
import AdminFoodManagement from './pages/Admin/FoodManagement';
import CouponManagement from './pages/Admin/CouponManagement';
import UserManagement from './pages/Admin/UserManagement';
import CustomerHome from './pages/Customer/Home';
import CustomerMenu from './pages/Customer/Menu';
import CustomerCart from './pages/Customer/Cart';
import OrderHistory from './pages/Customer/OrderHistory';
import AdminLayout from './components/AdminLayout';
import CustomerLayout from './components/CustomerLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const PrivateRoute = ({ children, adminOnly = false }: any) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/customer/menu" />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to={isAdmin ? '/admin/dashboard' : '/customer/home'} />
        ) : (
          <Login />
        )
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <PrivateRoute adminOnly>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="food" element={<AdminFoodManagement />} />
        <Route path="coupons" element={<CouponManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route index element={<Navigate to="/admin/dashboard" />} />
      </Route>

      {/* Customer Routes */}
      <Route path="/customer" element={
        <PrivateRoute>
          <CustomerLayout />
        </PrivateRoute>
      }>
        <Route path="home" element={<CustomerHome />} />
        <Route path="menu" element={<CustomerMenu />} />
        <Route path="cart" element={<CustomerCart />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route index element={<Navigate to="/customer/home" />} />
      </Route>

      <Route path="/" element={
        <Navigate to={isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/customer/home') : '/login'} />
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
