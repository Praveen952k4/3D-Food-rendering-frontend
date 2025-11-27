import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false, chefOnly = false }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const isChef = user?.role === 'chef';

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/customer/menu" />;
  }

  if (chefOnly && !isChef) {
    return <Navigate to="/customer/menu" />;
  }

  return children;
};

export default PrivateRoute;
