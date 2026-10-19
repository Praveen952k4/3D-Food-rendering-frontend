import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, defaultRouteFor } from '../../context/AuthContext';

/**
 * Gate a route on the signed-in role.
 *
 *   <PrivateRoute allow={['chef', 'admin']}>…</PrivateRoute>
 *
 * Someone signed in with the wrong role is sent to their own landing page
 * rather than to the sign-in screen, which would otherwise bounce them
 * straight back here.
 */
const PrivateRoute = ({ children, allow }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to={defaultRouteFor(role)} replace />;
  }

  return children;
};

export default PrivateRoute;
