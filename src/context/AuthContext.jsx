import React, { createContext, useContext, useState } from 'react';
import {
  verifyOTP as verifyOTPApi,
  guestLogin as guestLoginApi,
  staffLogin as staffLoginApi,
} from '../services/api';

const AuthContext = createContext(undefined);

/** Where each role lands once signed in. */
export const defaultRouteFor = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'chef') return '/chef/dashboard';
  if (role === 'guest' || role === 'customer') return '/customer/home';
  return '/login';
};

// Read the saved session before the first render. Restoring it in an effect
// instead meant the first render always looked signed out, so opening or
// refreshing any deep link bounced the user to their default page.
const storedSession = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return { token: null, user: null };
    return { token, user: JSON.parse(user) };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session] = useState(storedSession);
  const [user, setUser] = useState(session.user);
  const [token, setToken] = useState(session.token);

  const persist = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    return newUser;
  };

  /** Customer (and admin) sign-in: phone + OTP. */
  const login = async (phone, otp) => {
    const response = await verifyOTPApi(phone, otp);
    const { token: newToken, user: newUser } = response.data;
    return persist(newToken, newUser);
  };

  /** Guest sign-in: a table number, validated against the tables collection. */
  const loginGuest = async (tableNumber, name) => {
    const response = await guestLoginApi(tableNumber, name);
    const { token: newToken, user: newUser } = response.data;
    return persist(newToken, newUser);
  };

  /** Staff sign-in: staff ID + password. */
  const loginStaff = async (staffId, password) => {
    const response = await staffLoginApi(staffId, password);
    const { token: newToken, user: newUser } = response.data;
    return persist(newToken, newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isChef: user?.role === 'chef',
    isGuest: user?.role === 'guest',
    isCustomer: user?.role === 'customer',
    login,
    loginGuest,
    loginStaff,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
