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
const PrivateRoute = ({ children, allow, redirectTo }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo || '/login'} replace />;
  }

  if (allow && !allow.includes(role)) {
    // `redirectTo` names the door that would actually get them in — a guest
    // signed in by table number needs the booking door, not their own landing
    // page, which is where they already are.
    return <Navigate to={redirectTo || defaultRouteFor(role)} replace />;
  }

  return children;
};

export default PrivateRoute;
